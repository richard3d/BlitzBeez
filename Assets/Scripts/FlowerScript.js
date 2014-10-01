#pragma strict
private static var m_InstanceID : int = 0;


public var m_PollinationTimer : float = 0;
var m_PollinationTime : float = 5;
var m_LifeTexture:Texture2D = null;
var m_LifeBGTexture:Texture2D = null;
var ClockTexture : Texture2D = null;
var ClockHandTexture : Texture2D = null;
var m_NumBees : int = 0;
var m_MaxBees : int = 3;
var m_SwmXPPerSeconds : int = 1;
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
		var percent:float = GetComponentInChildren(ParticleEmitter).particleCount/10.0;
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
	else if (other.gameObject.tag == "Explosion" )
	{
		if(Network.isServer)
		{	
		
			if(gameObject.Find("/"+gameObject.name+"/"+"Swarm"+gameObject.name) == null)
				return;
			var m_Owner = GetComponentInChildren(BeeParticleScript).m_Owner;
			
			//dangerous need this in RPC somewhere
			GetComponent(PollenNetworkScript).m_Owner = null;
			if(m_Owner != null)
				m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, gameObject.name, GetComponentInChildren(ParticleEmitter).particleCount);
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
			gameObject.Find(gameObject.name+"/Shield").renderer.enabled = true;
		}
	}
}