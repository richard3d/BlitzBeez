#pragma strict

private static var m_InstanceID : int = 0;
private var m_Life : float = 1.25;
var m_HitEffect : GameObject = null;
var m_BombExplosion:GameObject = null; 
var m_HitSoundEffect : AudioClip = null;

var m_MuzzleEffect : GameObject = null;
var m_LaserEffect : GameObject = null;
var m_PowerShot : boolean = false;
var m_BulletType : int = -1;
var m_PowerShotType : int = -1;
var m_Owner : GameObject = null;
var m_Tgt : GameObject = null;
var m_Homing : float = 0;


class BulletCollision implements System.IComparable
{
	var hit:RaycastHit;
	var bullet:GameObject;
	
	 function CompareTo(obj: Object) : int {
	 
		var other:BulletCollision = obj;
		return hit.distance.CompareTo(other.hit.distance);
		
     }
   
}

function Awake()
{
	gameObject.name = "Bullet"+ ++m_InstanceID;
}

function Start () {

	var go : GameObject = gameObject.Instantiate(m_MuzzleEffect);
	var size:float = 1;
	var hit:RaycastHit;
	if(m_PowerShot)
	{
		var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
		for (var system:ParticleSystem in systems)
		{
			system.startSize *= 1.0;
			size = system.startSize;
		}
		
		if(m_PowerShotType == 0)
		{
			m_LaserEffect = GameObject.Instantiate(Resources.Load("GameObjects/LaserBeam"), transform.position, transform.rotation);
			m_LaserEffect.transform.localEulerAngles.x = 90;
			m_LaserEffect.GetComponent(LaserBeamScript).m_EndColor = GetComponent(TrailRenderer).material.GetColor("_Emission");
			m_LaserEffect.GetComponent(LaserBeamScript).m_StartColor = m_LaserEffect.GetComponent(LaserBeamScript).m_EndColor*1.5;
			GetComponent(UpdateScript).m_MaxSpeed = 3000;
			GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized*3000;
			
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
		
		
		if(Network.isServer)
		{
			var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
			if(Physics.Linecast(m_Owner.transform.position,transform.position+up.m_Vel.normalized * collider.bounds.extents.x,hit))
			{
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					Debug.Log("COLLISION IN START Happening above");
					var coll:BulletCollision = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
					OnBulletCollision(coll);
				}
			}
		}
	}
	
	if(m_BulletType == 2)
	{
		var accuracy:float = 0;
		if(Network.isServer)
		{
			var gos : GameObject[];
			gos = gameObject.FindGameObjectsWithTag("ItemBoxes");
			
			for(go in gos)
			{
				if(go == m_Owner)
					continue;
				var diff : Vector3 = go.transform.position - transform.position;
				if(Vector3.Dot(diff.normalized, up.m_Vel.normalized) > accuracy)
				{
					accuracy = Vector3.Dot(diff.normalized, up.m_Vel.normalized);
					m_Tgt = go;
				}
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
		
		var dist = (transform.position+up.m_Vel.normalized * collider.bounds.extents.x - up.m_PrevPos).magnitude;
		var hits:RaycastHit[];
		hits = Physics.SphereCastAll(up.m_PrevPos,transform.localScale.x * GetComponent(SphereCollider).radius,up.m_Vel.normalized, dist);
	    var arr = new Array();
		
		//collect all htis and store them in the bullet collision struct, this is then put into an array for sorting
		if(hits.length > 0)
		{
			for(hit in hits)
			{
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					var coll:BulletCollision = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					arr.Push(coll);
				}
			}
		}
		
		//sort the bullet collisions (near to far) and process them
		arr.Sort();
		for(coll in arr)
		{
			Debug.Log("COLL "+coll.hit.collider.gameObject.name);
			coll.hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
			if(OnBulletCollision(coll))
				break;
		}
	
		//homing round
		if(m_BulletType == 2)
		{
			if(m_Tgt != null)
			{
				if(Physics.Linecast(transform.position,m_Tgt.transform.position,hit))
				{
					if(hit.collider.gameObject == gameObject || hit.collider.gameObject == m_Tgt)
					{
						
						var diff : Vector3 = m_Tgt.transform.position - transform.position;
						var homing :float = Mathf.Max(0.3,Mathf.Abs(Vector3.Dot(up.m_Vel.normalized, diff.normalized)))*0.1;
						
						up.m_Vel = Vector3.Slerp(up.m_Vel, diff.normalized * up.m_Vel.magnitude, homing);
						//up.m_Vel += diff.normalized * homing ;
					}
				}
				else
				{
						diff = m_Tgt.transform.position - transform.position;
						homing = Mathf.Max(0.3,Mathf.Abs(Vector3.Dot(up.m_Vel.normalized, diff.normalized)))*0.1;
						up.m_Vel = Vector3.Slerp(up.m_Vel, diff.normalized * up.m_Vel.magnitude, homing);
						//up.m_Vel += diff.normalized * homing ;
				}
			}
		}
	}
	
	
	
	
	if(m_PowerShot)
	{
		transform.LookAt(transform.position + up.m_Vel);
		
		if(m_PowerShotType == 0)
		{
			if(m_LaserEffect != null)
			{
				var length:float = (transform.position - m_Owner.transform.position).magnitude;
				m_LaserEffect.GetComponent(LaserBeamScript).m_EndScale.y = length*2;
				m_LaserEffect.GetComponent(LaserBeamScript).m_StartScale.y = length*2;	
			}
		}
	}
	
	if(Network.isClient)
		return;
	m_Life -= Time.deltaTime;
	
	if(m_Life <= 0.0)
	{
		GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, gameObject.name);
	}

}


function OnBulletCollision(coll:BulletCollision) : boolean
{
	Debug.Log("BULLET COLLISION: "+coll.hit.collider.gameObject.name );
	var tag:String = coll.hit.collider.gameObject.tag;
	var other:GameObject = coll.hit.collider.gameObject;
	if(coll.hit.collider.isTrigger)
	{
		if(tag != "Flowers" && tag != "Hives")
			return false;
	}
	
	
	
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//standard (-1) laser {0} explosive (1) scatter(2)
		    case 0:
				 if(tag == "Rocks" || tag == "Terrain" || tag == "Trees" || tag == "ItemBoxes" ||  
				   (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner))
				   {
						if(m_LaserEffect != null)
						{
							Debug.Log("SHORTENING");
							var length:float = (coll.hit.point - transform.position).magnitude;
							m_LaserEffect.GetComponent(LaserBeamScript).m_EndScale.y = length*2;
							m_LaserEffect.GetComponent(LaserBeamScript).m_StartScale.y = length*2;	
						}
						transform.position = coll.hit.point;
						RemoveBullet(coll.hit.point);
						return true;
				   }
			break;
			case 2:
				if( tag == "Player" || tag == "Rocks" || tag == "Terrain" || tag == "Trees" || tag == "ItemBoxes" ||  
				   (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner))
				{
					var refNorm : Vector3 = coll.hit.normal;
					refNorm.y = 0;
					refNorm.Normalize();
					var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
					refVel.y = 0;
					refVel.Normalize();
					GetComponent(UpdateScript).m_Vel = refVel;
					//creates splinter bullet
					//m_PowerShotType = -1; 
					//create shrapnel bullets
					for(var i = 0 ; i < 9; i++)
					{
						var rot :Quaternion = Quaternion.AngleAxis((i-4) * 15,Vector3.up); 
						if( i == 0)
						{
							rot = Quaternion.identity;
						}
						refVel = rot*refNorm;
						Debug.Log(refVel);
						var go : GameObject  = Network.Instantiate(m_Owner.GetComponent(BeeControllerScript).m_BulletInstance, transform.position + refVel * 2, Quaternion.LookRotation(refVel, Vector3.up), 0);	
						go.GetComponent(BulletScript).m_BulletType = 0;
						m_Owner.networkView.RPC("Shot", RPCMode.All, go.name, go.transform.position+ refVel * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed, false);
					}
					
					RemoveBullet(coll.hit.point);	
				}
				return true;
			break;
			default:
				RemoveBullet(coll.hit.point);
				return true;
			break;
		}
	}
	else
	{
		switch (m_BulletType)
		{
			//ricochet type
			case 0: 
				refNorm = coll.hit.normal;
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
				if(coll.hit.collider.gameObject.GetComponent(PenetrableScript) != null)
				{
					var sum = Dice.RollDice(1, 6);
					if(sum/6.0 > (1-coll.hit.collider.gameObject.GetComponent(PenetrableScript).m_PercentChanceOfPenetration))
					{
						//m_BulletType = -1;
						ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					}
					else
					{
						
						RemoveBullet(transform.position+transform.forward * transform.localScale.x);
						return true;
					
					}
				}
				else
				{
					RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					return true;
				}
			break;
			default:
				if(tag == "Rocks" ||  tag == "Terrain" || tag == "Trees" ||  tag == "ItemBoxes" ||
				  (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner))
				  {
						RemoveBullet(coll.hit.point);
						return true;
					}	
			break;
		}
	}
	return false;
}

function OnCollisionStay(other : Collision)
{
	if(Network.isClient)
		return;
		
	if(other.gameObject.tag != "Bullets" && other.gameObject != m_Owner)
	{
		// Debug.Log(other.gameObject.name);
		// if(other.gameObject.tag == "Terrain")
		// {
			// //if the normal is straight up and there is only one contact (we hit parallel surface to floor which we dont care about)
			// //OR
			// if((Vector3.Dot(other.contacts[0].normal, Vector3.up) > 0.98 && other.contacts.length == 1) || Mathf.Abs(other.contacts[0].point.y - transform.position.y) > 1)
			// {
				 // Debug.Log("Collision SKIP "+other.contacts[0].normal+" "+ other.contacts.length);
					// return;
			// }
			// //OnTerrainCollision(transform.position+transform.forward * transform.localScale.x, other.contacts[0].normal);
		   // Debug.Log("Collision sty removal");
		   // RemoveBullet(transform.position);
		// }
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
					Debug.Log("removing");
					RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					break;
				//standard (-1) explosive (1) scatter(2)
				 case 2:
					 var refNorm : Vector3 = other.contacts[0].normal;//transform.position - other.transform.position;
					// refNorm.y = 0;
					// refNorm.Normalize();
					 var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
					// refVel.y = 0;
					// refVel.Normalize();
					// GetComponent(UpdateScript).m_Vel = refVel;
					// //creates splinter bullet
					// m_PowerShotType = -1; 
					// for(var i = 0 ; i < 5; i++)
					// {
						// var rot :Quaternion = Quaternion.AngleAxis((i) * 15,Vector3.up); 
						// if( i == 0)
						// {
							// rot = Quaternion.identity;
						// }
						// refVel = rot*refNorm;
						// Debug.Log(refVel);
						// var go : GameObject  = Network.Instantiate(m_Owner.GetComponent(BeeControllerScript).m_BulletInstance, transform.position + refVel * 2, Quaternion.LookRotation(refVel, Vector3.up), 0);	
						// m_Owner.networkView.RPC("Shot", RPCMode.All, go.name, go.transform.position+ refVel * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed);
					// }
					
					// RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					
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
				RemoveBullet(point);
				//m_PowerShotType-=2; 
				//ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, point);
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
			if(other.GetComponent(FlowerScript).m_Owner != m_Owner)
			{
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
				
			}
		}
		
	}
	else
	if(other.gameObject.tag == "Hives")
	{
		if(other.GetComponent(HiveScript).m_Owner != m_Owner)
		{
			// if(m_PowerShot)
				// networkView.RPC("DamageHive", RPCMode.All,other.gameObject.name, 5);
			// else
				// networkView.RPC("DamageHive", RPCMode.All,other.gameObject.name, 1);
			
			// RemoveBullet( Vector3(transform.position.x, 0 ,transform.position.z)+transform.forward * transform.localScale.x + Vector3(0,other.gameObject.transform.position.y,0));

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