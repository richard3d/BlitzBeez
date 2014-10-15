#pragma strict
private static var m_InstanceID : int = 0;

public var m_PollinationTimer : float = 0;
var m_PollinationTime : float = 5;

var m_Owner:GameObject = null; //which player controls this flower?
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
		var scrPos:Vector3 = Camera.main.WorldToScreenPoint(transform.position);
		var height = 12;
		var width = 48;
		if(transform.Find("Swarm"+gameObject.name) != null)
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
			//see if there is pollen to give
			var go = gameObject.Find("/"+gameObject.name+"/Pollen");
			if(go != null && GetComponentInChildren(BeeParticleScript).m_Owner == other.gameObject)
			{
				ServerRPC.Buffer(networkView,"GivePollen", RPCMode.All, other.gameObject.name);
			}
		}
		
		if(gameObject.Find(gameObject.name+"/Shield"))
		{
			Debug.Log("Here");
			gameObject.Find(gameObject.name+"/Shield").renderer.enabled = false;
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

@RPC function  SetHP(hp:int)
{

	m_HP = hp;
	if(m_HP <= 0)
	{
		//technically we should never be negative, but just in case
		m_HP = 0;
	
		//spawn effects
		var deathEffect : GameObject = gameObject.Instantiate(m_DeathEffect);
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
			Destroy(transform.GetChild(i).gameObject);
		}
		
		//this object has essentially been reset
		if(Network.isServer)
		{
			ServerRPC.DeleteFromBuffer(gameObject);
		}
	}
	else
	{
		m_LifebarTimer = 2;
	}
	
}

function OnTriggerExit(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
		if(gameObject.Find(gameObject.name+"/Shield"))
		{
			gameObject.Find(gameObject.name+"/Shield").renderer.enabled = true;
		}
	}
}