#pragma strict

private static var m_InstanceID : int = 0;
private var m_Life : float = 1.25;
var m_HitEffect : GameObject = null;
var m_BombExplosion:GameObject = null; 
var m_HitSoundEffect : AudioClip = null;

var m_MuzzleEffect : GameObject = null;
var m_PowerShot : boolean = false;
var m_BulletType : int = -1;
var m_PowerShotType : int = -1;
var m_Owner : GameObject = null;
var m_Tgt : GameObject = null;
var m_Homing : float = 0;


function Awake()
{
	gameObject.name = "Bullet"+ ++m_InstanceID;
	
	if(m_Owner)
		Physics.IgnoreCollision(collider, m_Owner.collider);
}

function Start () {

	var go : GameObject = gameObject.Instantiate(m_MuzzleEffect);
	var size:float = 1;
	if(m_PowerShot)
	{
		var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 1.0;
			size = system.startSize;
		}

	}
	else
	{
		systems = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 0.75;
			size = system.startSize;
		}
	}
	if(m_Owner)
	{
		go.transform.position =  m_Owner.transform.position+ m_Owner.transform.forward *size;
		go.transform.parent = m_Owner.transform;
		transform.position.y = m_Owner.transform.position.y;
		
		var hit:RaycastHit;
		if(Network.isServer)
		{
			var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
			if(Physics.Linecast(m_Owner.transform.position,transform.position+up.m_Vel.normalized * collider.bounds.extents.x,hit,m_Owner.GetComponent(TerrainCollisionScript).m_TerrainLayer))
			{
				OnTerrainCollision(hit.point, hit.normal);	
			}
		}
	}

}

function Update () {

	rigidbody.velocity = Vector3(0,0,0);
	// if(m_Owner == null)
		// return;
	var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	
	var hit:RaycastHit;
	if(Network.isServer)
	{
		if(Physics.Linecast(up.m_PrevPos,transform.position+up.m_Vel.normalized * collider.bounds.extents.x,hit,m_Owner.GetComponent(TerrainCollisionScript).m_TerrainLayer))
		{
			OnTerrainCollision(hit.point, hit.normal);	
		}
	}
	
	//homing round
	if(m_BulletType == 2)
	{
		
		var gos : GameObject[];
		gos = gameObject.FindGameObjectsWithTag("Rocks");
		for(var go : GameObject in gos)
		{
			//if(go == m_Owner)
			//	continue;
			var diff : Vector3 = go.transform.position - transform.position;
			var strength : float = Vector3.Dot(diff.normalized, up.m_Vel.normalized);
			 if(strength > 0.5)
				 up.m_Vel += diff.normalized * Time.deltaTime * 9 * (3500/diff.magnitude);
		}
	}
	
	
	if(m_PowerShot)
	{
		transform.LookAt(transform.position + up.m_Vel);
	}
	
	if(Network.isClient)
		return;
	m_Life -= Time.deltaTime;
	
	if(m_Life <= 0.0)
	{
		GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, gameObject.name);
	}

}

function OnCollisionStay(other : Collision)
{
	if(Network.isClient)
		return;
		
	if(other.gameObject.tag != "Bullets" && other.gameObject != m_Owner)
	{
		Debug.Log(other.gameObject.name);
		if(other.gameObject.tag == "Terrain")
		{
			//if the normal is straight up and there is only one contact (we hit parallel surface to floor which we dont care about)
			//OR
			if((Vector3.Dot(other.contacts[0].normal, Vector3.up) > 0.98 && other.contacts.length == 1) || Mathf.Abs(other.contacts[0].point.y - transform.position.y) > 1)
			{
				 Debug.Log("Collision SKIP "+other.contacts[0].normal+" "+ other.contacts.length);
					return;
			}
			//OnTerrainCollision(transform.position+transform.forward * transform.localScale.x, other.contacts[0].normal);
		   Debug.Log("Collision sty removal");
		   RemoveBullet(transform.position);
		}
	}
}


function OnCollisionEnter(other : Collision)
{
	if(Network.isClient)
		return;
		
	if(other.gameObject.tag != "Bullets" && other.gameObject != m_Owner)
	{
		//GetComponent(UpdateScript).m_Vel = refVel;
		if(other.gameObject.tag == "Terrain")	
			return;
		
		if(other.gameObject.name == "FlowerShield" && other.gameObject.GetComponent(FlowerShieldScript).m_Owner == m_Owner)
			return;
		
		Debug.Log("Bullet Standard Collision");
		
		if(m_PowerShot)
		{
			switch (m_PowerShotType)
			{
				//default
				//bulldozer
				case 0:
					m_PowerShotType--; 
					ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					break;
				//standard (-1) explosive (1) scatter(2)
				case 2:
					var refNorm : Vector3 = other.contacts[0].normal;//transform.position - other.transform.position;
					refNorm.y = 0;
					refNorm.Normalize();
					var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
					refVel.y = 0;
					refVel.Normalize();
					GetComponent(UpdateScript).m_Vel = refVel;
					//creates splinter bullet
					m_PowerShotType = -1; 
					for(var i = 0 ; i < 5; i++)
					{
						var rot :Quaternion = Quaternion.AngleAxis((i) * 15,Vector3.up); 
						if( i == 0)
						{
							rot = Quaternion.identity;
						}
						refVel = rot*refNorm;
						Debug.Log(refVel);
						var go : GameObject  = Network.Instantiate(m_Owner.GetComponent(BeeControllerScript).m_BulletInstance, transform.position + refVel * 2, Quaternion.LookRotation(refVel, Vector3.up), 0);	
						m_Owner.networkView.RPC("Shot", RPCMode.All, go.name, go.transform.position+ refVel * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed);
					}
					
					RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					
				break;
				default: 
					
					RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					
				break;
			}
		}
		else
		{
			switch (m_BulletType)
			{
				//ricochet type
				case 0: 
					refNorm = other.contacts[0].normal;
					refNorm.y = 0;
					refNorm.Normalize();
					refVel = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
					refVel.y = 0;
					m_BulletType = -1;
					refVel.Normalize();
					GetComponent(UpdateScript).m_Vel = refVel*GetComponent(UpdateScript).m_MaxSpeed;
					ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
				break;
				//penetration
				case 1:
					if(other.gameObject.GetComponent(PenetrableScript) != null)
					{
						var sum = Dice.RollDice(1, 6);
						if(sum/6.0 > (1-other.gameObject.GetComponent(PenetrableScript).m_PercentChanceOfPenetration))
						{
							//m_BulletType = -1;
							ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
						}
						else
						{
							
							RemoveBullet(transform.position+transform.forward * transform.localScale.x);
						
						}
					}
					else
					{
						
						RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					
					}
				break;
				default:
					
					RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					
				break;
			}
			//ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
			//ServerRPC.DeleteFromBuffer(gameObject);
		}
		
	}
}


function OnTerrainCollision(point:Vector3, normal:Vector3)
{
	if(Network.isClient)
		return;

//	Debug.Log(normal);
	if(Vector3.Dot(normal, Vector3.up) > 0.98 )
		return;
				
		
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//default
			//bulldozer
			case 0:
				m_PowerShotType--; 
				ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, point);
				break;
			//standard (-1) explosive (1) scatter(2)
			case 2:
				var refNorm : Vector3 = normal;//transform.position - other.transform.position;
				refNorm.y = 0;
				refNorm.Normalize();
				var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
				refVel.y = 0;
				refVel.Normalize();
				GetComponent(UpdateScript).m_Vel = refVel;
				//creates splinter bullet
				m_PowerShotType = -1; 
				for(var i = 0 ; i < 5; i++)
				{
					var rot :Quaternion = Quaternion.AngleAxis((i) * 15,Vector3.up); 
					if( i == 0)
					{
						rot = Quaternion.identity;
					}
					refVel = rot*refNorm;
					//Debug.Log(refVel);
					var go : GameObject  = Network.Instantiate(m_Owner.GetComponent(BeeControllerScript).m_BulletInstance, transform.position + refVel * 2, Quaternion.LookRotation(refVel, Vector3.up), 0);	
					m_Owner.networkView.RPC("Shot", RPCMode.All, go.name, go.transform.position+ refVel * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed);
				}
				
				RemoveBullet(point);
				
			break;
			default: 
				
				RemoveBullet(point);
				
			break;
		}
	}
	else
	{
		switch (m_BulletType)
		{
			//ricochet type
			case 0: 
				refNorm = normal;
				refNorm.y = 0;
				refNorm.Normalize();
				refVel = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
				refVel.y = 0;
				m_BulletType = -1;
				refVel.Normalize();
				GetComponent(UpdateScript).m_Vel = refVel*GetComponent(UpdateScript).m_MaxSpeed;
				ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, point);
			break;
			//penetration
			case 1:
				
					
					RemoveBullet(point);
				
				
			break;
			default:
				
				RemoveBullet(point);
				
			break;
		}
		//ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
		//ServerRPC.DeleteFromBuffer(gameObject);
	}
	
	
	

}

function OnTriggerEnter(other : Collider)
{
	//NOTE: powershots should always do 5 dmg
	if(Network.isClient)
		return;
	if(other.gameObject.tag == "Flowers")
	{
		if(GameObject.Find(other.name+"/Shield")!= null)
		{
			//make sure we arent shooting our own bees
		//	if(other.GetComponentInChildren(BeeParticleScript).m_Owner != GetComponent(BulletScript).m_Owner)
		//	{
				//Handle power shot
				if(m_PowerShot)
				{
					ServerRPC.Buffer(other.gameObject.networkView, "SetHP", RPCMode.All, other.gameObject.GetComponent(FlowerScript).m_HP-5);
				}
				//handle regular shot
				else
				{
					//other.gameObject.GetComponent(FlowerScript)
					ServerRPC.Buffer(other.gameObject.networkView, "SetHP", RPCMode.All, other.gameObject.GetComponent(FlowerScript).m_HP-1);
					
				}
				//destroy bullet
				
				RemoveBullet(transform.position+transform.forward * transform.localScale.x);
				
		//	}
		}
		
	}
	else
	if(other.gameObject.tag == "Hives")
	{
		if(other.GetComponent(HiveScript).m_Owner != m_Owner)
		{
			if(m_PowerShot)
				networkView.RPC("DamageHive", RPCMode.All,other.gameObject.name, 5);
			else
				networkView.RPC("DamageHive", RPCMode.All,other.gameObject.name, 1);
			
			RemoveBullet( Vector3(transform.position.x, 0 ,transform.position.z)+transform.forward * transform.localScale.x + Vector3(0,other.gameObject.transform.position.y,0));

		}
	}
}

@RPC function BulletHit(pos:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	if(m_PowerShot)
	{
		var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 3;
		}
	}
}

function RemoveBullet(pos:Vector3)
{
	//this function first checs if the bullet is already marked as 'dead' (by checking the lifespan)
	//it is possible a bullet collides with multiple objects at once but we can only have the rpc call happen once
	//otherwise the client destroys the bullet and another RPC arrives from the server due to second collision
	if(m_Life > 0)
	{
		ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, pos);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
	m_Life = -1;
}

@RPC
function KillBullet(pos:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	if(m_PowerShot)
	{
		var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 3;
		}
		switch (m_PowerShotType)
		{
			
			
			//explosive
			case 1: 
				go = gameObject.Instantiate(m_BombExplosion);
				go.transform.position = transform.position;
				go.transform.position.y = 0;
				Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
			break;
			//scatter
			case 2: 
			break;
		}
		

	}
	AudioSource.PlayClipAtPoint(m_HitSoundEffect, pos);
	Destroy(gameObject);
} 

@RPC
function DamageHive(hiveName:String, dmgAmt:int)
{
	var hive:GameObject = gameObject.Find(hiveName);
	hive.GetComponent(HiveScript).m_HP -= dmgAmt;
	
	
	if(hive.GetComponent(FlasherDecorator) == null)
	{
		hive.AddComponent(FlasherDecorator);
		hive.GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
		hive.GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
	}
	
	if(hive.GetComponent(HiveScript).m_HP <= 0)
	{
		//destroy the hive
		Destroy(gameObject.Find(hiveName));
	}
	else
		hive.GetComponent(HiveScript).m_LifebarTimer = 2;
}