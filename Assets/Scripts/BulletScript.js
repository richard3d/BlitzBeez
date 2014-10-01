#pragma strict

private static var m_InstanceID : int = 0;
private var m_Life : float = 2;
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
			system.startSize *= 0.5;
			size = system.startSize;
		}
	}
	if(m_Owner)
	{
		go.transform.position =  m_Owner.transform.position+ m_Owner.transform.forward *size;
		go.transform.parent = m_Owner.transform;
		transform.position.y = m_Owner.transform.position.y;
	}

}

function Update () {

	rigidbody.velocity = Vector3(0,0,0);

	var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	//homing round
	if(m_BulletType == 2)
	{
		
		var gos : GameObject[];
		gos = gameObject.FindGameObjectsWithTag("Player");
		for(var go : GameObject in gos)
		{
			if(go == m_Owner)
				continue;
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

function OnCollisionEnter(other : Collision)
{
	if(Network.isClient)
		return;
		
	if(other.gameObject.tag != "Bullets" && other.gameObject != m_Owner)
	{
		
		Debug.Log(other.gameObject.name);
		
		//GetComponent(UpdateScript).m_Vel = refVel;
		if(other.gameObject.tag == "Terrain")
		{
			if(Vector3.Dot(other.contacts[0].normal, Vector3.up) > 0.98)
				return;
		}
		
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
					
					ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					ServerRPC.DeleteFromBuffer(gameObject);
				break;
				default: 
					ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					ServerRPC.DeleteFromBuffer(gameObject);
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
							ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
							ServerRPC.DeleteFromBuffer(gameObject);
						}
					}
					else
					{
						ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
						ServerRPC.DeleteFromBuffer(gameObject);
					}
				break;
				default:
					ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					ServerRPC.DeleteFromBuffer(gameObject);
				break;
			}
			//ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
			//ServerRPC.DeleteFromBuffer(gameObject);
		}
		
		//if(m_PowerShot)
		//{
			// var refNorm : Vector3 = transform.position - other.transform.position;
			// refNorm.y = 0;
			// refNorm.Normalize();
			// var refVel : Vector3 = Vector3.Reflect(-GetComponent(UpdateScript).m_Vel, refNorm);
			// refVel.y = 0;
			// refVel.Normalize();
		

			// var diff : Vector3 = coll.transform.position - transform.position;
			// diff.Normalize();
			 // for(var child : Transform in transform)
			 // {
				// child.parent = null;
				// var pos : Vector3 = GetComponent(CapsuleCollider).center;
				// pos.y = 0;
				// pos = Vector3.Scale(pos, transform.localScale);
				// child.transform.position = pos + transform.position  - diff *GetComponent(CapsuleCollider).radius * transform.localScale.x +Vector3.up* 40;
				// var vel : Vector3 = child.transform.position - transform.position;
		
			//creates splinter bullet
			// var go : GameObject  = Network.Instantiate(m_Owner.GetComponent(BeeControllerScript).m_BulletInstance, transform.position + refNorm * 2, Quaternion.identity, 0);	
			 // m_Owner.networkView.RPC("Shot", RPCMode.All, go.name, go.transform.position+ refNorm * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed);
		//}
		
		//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, gameObject.name);
	}
	
	// if(other.gameObject.tag != "Bullets" && other.gameObject != m_Owner)
	// {
		
		// var go : GameObject = gameObject.Instantiate(m_HitEffect);
		// Debug.Log("nombre"+other.gameObject.name);
		
		
		// go.transform.position = transform.position+transform.forward * transform.localScale.x;
		// Debug.Log( "norm"+other.contacts[0].normal);
		// if(m_PowerShot)
		// {
			// var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
			// for (var system:ParticleSystem in systems)
			// {
				// system.startSize *= 3;
			// }

		// }
	// }
}

function OnTriggerEnter(other : Collider)
{
	//NOTE: powershots should always do 5 dmg
	if(Network.isClient)
		return;
	if(other.gameObject.tag == "Flowers")
	{
		if(other.GetComponentInChildren(BeeParticleScript) != null)
		{
			//make sure we arent shooting our own bees
			if(other.GetComponentInChildren(BeeParticleScript).m_Owner != GetComponent(BulletScript).m_Owner)
			{
				//Handle power shot
				if(m_PowerShot)
				{
					if(other.GetComponentInChildren(ParticleEmitter).particleCount <= 5)
					{
						//give the player some Experience
						//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, "Swarm"+other.gameObject.name);
					}
					
					for(var i: int = 0; i < 5; i++)
					{
						m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, other.gameObject.name, 1);
					}
				}
				//handle regular shot
				else
				{
					if(other.GetComponentInChildren(ParticleEmitter).particleCount <= 1)
					{
						//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, "Swarm"+other.gameObject.name);
					}
					m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, other.gameObject.name, 1);
				}
				//destroy bullet
			ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
			ServerRPC.DeleteFromBuffer(gameObject);
			}
			
			//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, gameObject.name);
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
			ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, Vector3(transform.position.x, 0 ,transform.position.z)+transform.forward * transform.localScale.x + Vector3(0,other.gameObject.transform.position.y,0));
			ServerRPC.DeleteFromBuffer(gameObject);
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
	if(hive.GetComponent(HiveScript).m_HP <= 0)
	{
		//destroy the hive
		Destroy(gameObject.Find(hiveName));
	}
	else
		hive.GetComponent(HiveScript).m_LifebarTimer = 2;
}