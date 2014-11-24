#pragma strict

var m_Owner : GameObject = null;
var m_ExplosionParticles :GameObject = null;
var m_RespawnParticles : GameObject = null;
var m_Pedestal : GameObject = null;
private var m_InitPos : Vector3;
private static var m_InstanceID : int = 0;

var m_MaxHP : int = 100;
var m_HP : int = 100;
var m_BaseHP : int = 100;		 //(the starting HP for the hive
var m_LifeTexture:Texture2D = null;
var m_LifeBGTexture:Texture2D = null;
var m_LifebarTimer : float = 1;
function Awake()
{
	m_LifebarTimer = 0;
	name = "Hive"+ ++m_InstanceID;
}

function Start () {

	m_HP = m_BaseHP;
	if(animation["SpawnHive"] != null)
		animation.Play("SpawnHive");
	m_InitPos = transform.position;
	if(m_RespawnParticles != null)
	{
		var go : GameObject = gameObject.Instantiate(m_RespawnParticles);
		go.transform.position = transform.position;
	}
	

}

function Update () {	
	if(!animation.isPlaying)
		transform.position.y = m_InitPos.y + Mathf.Sin(Time.time*6) *2;
}

function OnGUI()
{
	if(m_LifebarTimer > 0)
	{
		m_LifebarTimer -= Time.deltaTime;
		var scrPos:Vector3 = Camera.main.WorldToScreenPoint(transform.position);
		var height = 12;
		var width = 48;
		
		var maxHP = m_MaxHP * 1.0;
		
		var percent:float = m_HP/maxHP;
		
		GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width, height), m_LifeBGTexture);
		GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width*percent, height), m_LifeTexture);
		
	}
}

function OnTriggerStay(other : Collider)
{
	if(other.gameObject.tag == "Player" && other.gameObject == m_Owner)
	{
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
		
		if(other.gameObject.GetComponent(HoneyDepositDecorator) == null && other.gameObject.GetComponent(BeeScript).m_PollenCount == 0)
		{
			if(NetworkUtils.IsControlledGameObject(other.gameObject))
			{
				var txt : GameObject  = gameObject.Find("UseText");
				txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
				txt.transform.position.y += 0.04;
				//txt.GetComponent(GUIText).enabled = true;
				//txt.GetComponent(GUIText).text = "Enter Hive";
			}
		}
		//call cash in on the bee
		if(Network.isServer)
			ServerRPC.Buffer(other.gameObject.networkView,"PollenCashIn", RPCMode.All, other.gameObject.name, gameObject.name);
			///other.gameObject.networkView.RPC("PollenCashIn", RPCMode.All, other.gameObject.name, gameObject.name);
	}
	
}

function OnTriggerEnter(other:Collider)
{
	if (other.gameObject.tag == "Explosion")
	{
		if(other.GetComponent(BombExplosionScript).m_Owner != null && other.GetComponent(BombExplosionScript).m_Owner != m_Owner)
		{
			if(Network.isServer && m_HP > 0)
			{	
				m_HP -= m_BaseHP/2;
				ServerRPC.Buffer(m_Pedestal.networkView, "SetHiveHP",RPCMode.All,name, m_HP);	//we do this on the pedestal because it actually has a networkview (hives do not)
			}
		}
	}
	else if (other.gameObject.tag == "Hammer")
	{
		if(other.GetComponent(HammerScript).m_Owner != null && other.GetComponent(HammerScript).m_Owner != m_Owner)
		{
			if(Network.isServer && m_HP > 0)
			{	
				m_HP -= m_BaseHP/4;
				ServerRPC.Buffer(m_Pedestal.networkView, "SetHiveHP",RPCMode.All,name, m_HP);
			}
		}
	}
	else if (other.gameObject.tag == "Rocks")
	{
		if(m_Owner != null && m_Owner.GetComponent(ItemDecorator) == null)
		{
			if(other.GetComponent(RockScript).m_Owner != m_Owner)
			{
				if(Network.isServer && m_HP > 0)
				{	
					m_HP -= m_BaseHP/4;
					ServerRPC.Buffer(m_Pedestal.networkView, "SetHiveHP",RPCMode.All,name, m_HP);
				}
			
			}
		}
	}
}

function OnTriggerExit(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		var txt : GameObject  = gameObject.Find("UseText");
		txt.GetComponent(GUIText).enabled = false;
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
		
	
		
	}
}

function OnDestroy()
{
	if(m_Pedestal != null)
	{
		m_Pedestal.GetComponent(PollenNetworkScript).m_Owner = null;
		m_Pedestal.GetComponent(HivePedestalScript).m_Activated = false;
		m_Pedestal.renderer.material.mainTexture = m_Pedestal.GetComponent(HivePedestalScript).m_TempTexture;
	}
	
	if(m_ExplosionParticles != null && m_HP <= 0)
	{
		var go:GameObject =  gameObject.Instantiate(m_ExplosionParticles);
		go.transform.position = transform.position;
	}
}

//kinda funky but this gets called from the pedestal since it actually has a network view
function SetHP(hp:int)
{
	m_HP = hp;
	if(m_HP <= 0)
	{
		//technically we should never be negative, but just in case
		m_HP = 0;
	
		
		
		//CLEAN UP
		//if(m_Owner != null)
		//	m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, gameObject.name, GetComponentInChildren(ParticleEmitter).particleCount);
		m_Owner = null;
		m_LifebarTimer = -1;
		
		//destroy any children we have left
		for(var i:int = 0;  i < transform.childCount; i++)
		{
			Destroy(transform.GetChild(i).gameObject);
		}
		
		//this object has essentially been reset
		if(Network.isServer)
		{
			ServerRPC.DeleteFromBuffer(m_Pedestal);
		}
		Destroy(gameObject);
	}
	else
	{
		m_LifebarTimer = 2;
	}	
}


