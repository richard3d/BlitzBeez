#pragma strict

var m_Owner : GameObject = null;
var m_ExplosionParticles :GameObject = null;
var m_RespawnParticles : GameObject = null;
var m_Pedestal : GameObject = null;
private var m_InitPos : Vector3;
private static var m_InstanceID : int = 0;

var m_MaxHP : int = 100;
var m_HP : int = 100;
var m_LifeTexture:Texture2D = null;
var m_LifeBGTexture:Texture2D = null;
var m_LifebarTimer : float = 1;
function Awake()
{
	m_LifebarTimer = 0;
	name = "Hive"+ ++m_InstanceID;
}

function Start () {

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
				txt.GetComponent(GUIText).enabled = true;
				txt.GetComponent(GUIText).text = "Enter Hive";
			}
		}
		//call cash in on the bee
		if(Network.isServer)
			ServerRPC.Buffer(other.gameObject.networkView,"PollenCashIn", RPCMode.All, other.gameObject.name, gameObject.name);
			//other.gameObject.networkView.RPC("PollenCashIn", RPCMode.All, other.gameObject.name, gameObject.name);
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
		m_Pedestal.GetComponent(HivePedestalScript).m_Activated = false;
		m_Pedestal.renderer.material.mainTexture = m_Pedestal.GetComponent(HivePedestalScript).m_TempTexture;
	}
	
	if(m_ExplosionParticles != null && m_HP <= 0)
	{
		var go:GameObject =  gameObject.Instantiate(m_ExplosionParticles);
		go.transform.position = transform.position;
	}
}


