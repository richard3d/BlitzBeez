#pragma strict

private static var m_InstanceID : int = 0;
private var m_Life : float = 2;
var m_HitEffect : GameObject = null;
var m_HitSoundEffect : AudioClip = null;
var m_MuzzleEffect : GameObject = null;
var m_PowerShot : boolean = false;
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
	var gos : GameObject[];
	// gos = gameObject.FindGameObjectsWithTag("Bears");
	// for(var go : GameObject in gos)
	// {
		// if(go == m_Owner)
			// continue;
		// var diff : Vector3 = go.transform.position - transform.position;
		// var strength : float = Vector3.Dot(diff.normalized, up.m_Vel.normalized);
		 // if(strength > 0.5)
			 // up.m_Vel += diff.normalized * Time.deltaTime * 9 * (2500/diff.magnitude);
	// }
	
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
		
	if(other.gameObject.tag != "Bullets" && other.gameObject.tag != "Terrain" && other.gameObject != m_Owner)
	{
		
		Debug.Log(other.gameObject.name);
		var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, other.contacts[0].normal);
		refVel.y = 0;
		//GetComponent(UpdateScript).m_Vel = refVel;
		
		
		
		ServerRPC.Buffer(networkView, "KillBullet", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
		ServerRPC.DeleteFromBuffer(gameObject);
		
		
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