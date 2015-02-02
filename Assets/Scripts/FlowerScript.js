#pragma strict
private static var m_InstanceID : int = 0;

public var m_PollinationTimer : float = 0;
var m_PollinationTime : float = 5;

var m_Owner:GameObject = null; //which player controls this flower?
var m_Occupied:boolean = false; //Is there a bee currently on this flower?
var m_PointsPerSecond:float = 1; //how many points per second does this flower generate when it is controlled
@HideInInspector
var m_NumBees : int = 0;		 //how many bees are on this flower?
var m_MaxBees : int = 3;		 //what is the maximum number of bees that may be put on this flower?
var m_BaseHP : int = 10;		 //(the starting HP for the flower, m_MaxHP = m_MaxBees * m_BaseHP
var m_HP : int = 0;  			 //curr flower hp           

//GUI stuff
var m_LifeTexture:Texture2D = null;
var m_LifeBGTexture:Texture2D = null;
var m_DroneAssignmentTexture : Texture2D = null;
var m_AssignmentFlasherTexture : Texture2D = null;


//Effects
var m_DeathSound : AudioClip = null; 
var m_HurtSound : AudioClip = null; 
var m_DeathEffect : GameObject = null;
var m_PollenItem : GameObject = null;
var m_PollenParticles : GameObject = null;
var m_LifebarTimer : float = 1;
var m_ProgressEffectInstance : GameObject = null;


var m_BuildComplete : AudioClip;
var m_StopwatchDing: AudioClip;
function Awake()
{
	gameObject.name = "Flower"+ ++m_InstanceID;
}
function Start () {

m_PollinationTimer = 0;
var m_PollinationTime = 15;

//m_ProgressEffect = gameObject.Instantiate(m_ProgressEffectInstance);
//m_ProgressEffect.active = false;

}

function Update () {

	if(transform.Find("Swarm"+gameObject.name) != null)
	{
		if(m_PollinationTimer < m_PollinationTime)
		{
			m_PollinationTimer += Time.deltaTime;
			
			var width : float = 32;
			var pos : Vector3 = Camera.main.WorldToScreenPoint(transform.position+Vector3(0,1,0));
			// m_ProgressEffect = gameObject.Instantiate(m_ProgressEffectInstance);
			// m_ProgressEffect.transform.position = transform.position + Vector3.up * 6;
			// m_ProgressEffect.transform.localScale = Vector3(23,0,23);
			// m_ProgressEffect.renderer.material.SetFloat("_Cutoff", 1-Mathf.Min(m_PollinationTimer/m_PollinationTime,1));
			
			
		}
		else
		{
			//m_ProgressEffect.active = false;
			var go = gameObject.Find("/"+gameObject.name+"/Pollen");
			if( go == null)
			{
				if(Network.isServer)
				{
					//ServerRPC.Buffer(networkView,"SpawnPollen", RPCMode.All);
				}
			}		
		}
	}
	else
	{
		//m_ProgressEffect.active = false;
	}

}

function OnGUI()
{
	if(m_LifebarTimer > 0)
	{
		m_LifebarTimer -= Time.deltaTime;
		var scrPos:Vector3 = Camera.main.WorldToScreenPoint(transform.position+ Vector3.up * transform.localScale.y * 1.25);
		var height = 12;
		var width = 48;
		if(transform.Find("Shield") != null)
		var percent:float = m_HP;
		percent /= (m_NumBees * m_BaseHP);
		GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width, height), m_LifeBGTexture);
		GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width*percent, height), m_LifeTexture);
		
	}
}



@RPC function SpawnPollen()
{
	var pollen:GameObject = gameObject.Instantiate(m_PollenItem);
	pollen.transform.parent = gameObject.transform;
	pollen.transform.position = transform.position + Vector3(0,22,0);
	gameObject.Destroy(gameObject.Find("/"+gameObject.name+"/PollenParticles"));
}

@RPC function GivePollen(player:String)
{
	m_PollinationTimer = 0;
	var bee:GameObject = GameObject.Find(player);
	m_PollenParticles = gameObject.Instantiate(Resources.Load("GameObjects/PollenParticles"));
	m_PollenParticles.transform.position = gameObject.transform.position;
	m_PollenParticles.name = "PollenParticles";
	m_PollenParticles.transform.parent = gameObject.transform;
	gameObject.Find("/"+gameObject.name+"/Pollen").animation.Stop();
	gameObject.Find("/"+gameObject.name+"/Pollen").GetComponent(PollenScript).m_Owner = bee;
}




function OnTriggerEnter(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
		if(Network.isServer)
		{
			// //see if there is pollen to give
			// var go = gameObject.Find("/"+gameObject.name+"/Pollen");
			// if(go != null && GetComponentInChildren(BeeParticleScript).m_Owner == other.gameObject)
			// {
				// ServerRPC.Buffer(networkView,"GivePollen", RPCMode.All, other.gameObject.name);
			// }
		}
		
		if(m_Owner == other.gameObject)
		{
			collider.isTrigger = true;
			if(gameObject.Find(gameObject.name+"/Shield"))
			{
				Debug.Log("Here");
				gameObject.Find(gameObject.name+"/Shield").renderer.enabled = false;
				gameObject.Find(gameObject.name+"/LightSpot").renderer.enabled = false;
			}
		}
	}
	else if (other.gameObject.tag == "Explosion" && other.gameObject == m_Owner)
	{
		if(Network.isServer && m_HP > 0)
		{	
			m_HP -= m_BaseHP;
			ServerRPC.Buffer(networkView, "SetHP",RPCMode.All, m_HP);
		}
	}
	else if (other.gameObject.tag == "Hammer" && other.gameObject == m_Owner)
	{
		if(Network.isServer && m_HP > 0)
		{	
			m_HP -= m_BaseHP;
			ServerRPC.Buffer(networkView, "SetHP",RPCMode.All, m_HP);
		}
	}
}

function OnBulletCollision(coll:BulletCollision)
{
	if(Network.isServer)
	{	
		if(GameObject.Find(gameObject.name+"/Shield")!= null)
		{
			
			//make sure we arent shooting our own bees
			var bs:BulletScript =coll.bullet.GetComponent(BulletScript);
			//if(bs.m_Owner != m_Owner)
			//{
				//Handle power shot
				if(bs.m_PowerShot)
				{
					ServerRPC.Buffer(networkView, "SetHP", RPCMode.All, m_HP-5);
				}
				//handle regular shot
				else
				{
					ServerRPC.Buffer(networkView, "SetHP", RPCMode.All, m_HP-1);					
				}
			//}
		}
	}
}

function OnTriggerStay(coll : Collider)
{
	var player:GameObject = null;

	if(NetworkUtils.IsControlledGameObject(coll.gameObject))
	{	
		
		//handle player specific logic if the player is us
		if(coll.gameObject.GetComponent(ItemDecorator) == null && coll.gameObject.GetComponent(FlowerDecorator) == null 
		   && coll.gameObject.GetComponent(BeeScript).m_WorkerBees > 0)
		{
			
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.transform.position = Camera.main.WorldToViewportPoint(coll.gameObject.transform.position);
			txt.transform.position.y += 0.03;
			if(!txt.GetComponent(GUITexture).enabled)
			{
				txt.GetComponent(GUITexture).enabled = true;
				txt.animation.Play();
			}
		}
		else
		{
			if(NetworkUtils.IsControlledGameObject(coll.gameObject))
			{
				txt  = gameObject.Find("GUITexture");	
				txt.GetComponent(GUITexture).enabled = false;
			}
		}
	}
}

@RPC function  SetHP(hp:int)
{

	m_HP = hp;
	if(m_HP <= 0 && m_Owner)
	{
		//technically we should never be negative, but just in case
		m_HP = 0;
		collider.isTrigger = true;
		AudioSource.PlayClipAtPoint(m_DeathSound, Camera.main.transform.position);
	
		//spawn effects
		var deathEffect : GameObject = gameObject.Instantiate(m_DeathEffect);
		deathEffect.transform.position = transform.position + Vector3(0,12,0);
		deathEffect.renderer.material.color = m_Owner.renderer.material.color;
		
		deathEffect = gameObject.Instantiate(Resources.Load("GameObjects/ExplosionParticles"));
		deathEffect.transform.position = transform.position + Vector3(0,12,0);
		deathEffect.renderer.material.color = m_Owner.renderer.material.color;
		
		//CLEAN UP
		//if(m_Owner != null)
		//	m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, gameObject.name, GetComponentInChildren(ParticleEmitter).particleCount);
		m_Owner = null;
		m_NumBees = 0;
		m_LifebarTimer = -1;
		
		//destroy any children we have left
		for(var i:int = 0;  i < transform.childCount; i++)
		{
			if(transform.GetChild(i).gameObject.GetComponent(WorkerBeeScript) != null)
				transform.GetChild(i).gameObject.GetComponent(WorkerBeeScript).Kill();
			else
				Destroy(transform.GetChild(i).gameObject);
		}
		
		//this object has essentially been reset
		if(Network.isServer)
		{
			ServerRPC.DeleteFromBuffer(gameObject);
			// for(i = 0; i < 3; i++)
			// {
				// var Quat = Quaternion.AngleAxis(360.0/3 * i, Vector3.up);
				// var vel =  Quat*Vector3(0,0,1) ;//: Vector2 = Random.insideUnitCircle.normalized*50;
				// var viewID : NetworkViewID= Network.AllocateViewID();
				// var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate("Coin","", transform.position + Vector3.up *transform.localScale.magnitude, Quaternion.identity, viewID ,  0);
				// go1.GetComponent(UpdateScript).m_Vel = vel.normalized * Random.Range(20, 50);
				// //go1.GetComponent(UpdateScript).m_Vel.z = vel.y;
				// go1.GetComponent(UpdateScript).m_Vel.y = Random.Range(20, 100);
				// ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, "Coin",go1.name, transform.position + Vector3.up *transform.localScale.magnitude, Quaternion.identity, viewID, 0);
				// go1.GetComponent(UpdateScript).MakeNetLive(); 	
			// }
		}
	}
	else
	{
		if(gameObject.Find(gameObject.name+"/Shield"))
		{
			m_LifebarTimer = 2;
			AudioSource.PlayClipAtPoint(m_HurtSound, Camera.main.transform.position);
			if(GetComponent(FlasherDecorator) == null)
			{
				gameObject.AddComponent(FlasherDecorator);
				GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
				GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
				transform.Find("LightSpot").animation.Stop();
				transform.Find("LightSpot").animation.Play();
			}
			//GetComponent(FlasherDecorato
		}
	}
	
}

function OnTriggerExit(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
				
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
		if(gameObject.Find(gameObject.name+"/Shield"))
		{
			collider.isTrigger = false;
			gameObject.Find(gameObject.name+"/Shield").renderer.enabled = true;
			gameObject.Find(gameObject.name+"/LightSpot").renderer.enabled = true;
		}
		
		if(NetworkUtils.IsControlledGameObject(other.gameObject))
		{
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.GetComponent(GUITexture).enabled = false;
		}
	}
}