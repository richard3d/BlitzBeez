#pragma strict
var m_Hive:GameObject = null;
var m_ProgressEffectInstance : GameObject = null;
var m_ActivatedTexture : Texture2D = null;
var m_Colliding : boolean = false;
var m_Activated : boolean = false;
private var m_NumColliding : int = 0;
var m_TempTexture : Texture2D;

var LifeTexture : Texture2D = null;
var BaseTexture : Texture2D = null;
var m_BuildingTexture : Texture2D = null;
var ClockTexture : Texture2D = null;
var ClockHandTexture : Texture2D = null;

var m_BuildComplete: AudioClip;
var m_StopwatchDing: AudioClip;

function Start () {

}

function Update () {

}

function OnTriggerEnter(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
	}
}
function OnTriggerStay(coll : Collider)
{
	var player:GameObject = null;
	if(coll.gameObject.tag == "Player" )
	{	

		//handle player specific logic if the player is us
		if(coll.gameObject.GetComponent(ItemDecorator) == null/*&& animation.isPlaying == false*/)
		{
			if(m_Activated)
			{
				if(m_Hive != null)
					coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = m_Hive;
			}
			else
			{
				coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
			}
			
			if(NetworkUtils.IsControlledGameObject(coll.gameObject))
			{	
				// var txt : GameObject  = gameObject.Find("UseText");
				// txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
				// txt.transform.position.y += 0.04;
				// txt.GetComponent(GUIText).enabled = true;
				// txt.GetComponent(GUIText).text = "Use";
				var txt : GameObject  = gameObject.Find("GUITexture");	
				txt.transform.position = Camera.main.WorldToViewportPoint(coll.gameObject.transform.position);
				txt.transform.position.y += 0.03;
				if(!txt.GetComponent(GUITexture).enabled)
				{
					txt.GetComponent(GUITexture).enabled = true;
					txt.animation.Play();
				}
			}
		}
		else
		{
			if(NetworkUtils.IsControlledGameObject(coll.gameObject))
			{	
				//txt  = gameObject.Find("UseText");
				//txt.GetComponent(GUIText).enabled = false;
				txt = gameObject.Find("GUITexture");	
				txt.GetComponent(GUITexture).enabled = false;
			}
		}
	}
}


function OnTriggerExit(coll : Collider)
{
	if(coll.gameObject.tag == "Player")
	{	
		//code to handle if the player is our controlling player
		if(NetworkUtils.IsControlledGameObject(coll.gameObject))
		{
			//var txt : GameObject  = gameObject.Find("UseText");	
			//txt.GetComponent(GUIText).enabled = false;
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.GetComponent(GUITexture).enabled = false;
		}
		coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
	}
}

function Activate()
{
	m_TempTexture = renderer.material.mainTexture;
	renderer.material.mainTexture = m_ActivatedTexture;
	m_Activated = true;
}

@RPC
function SetHiveHP(hive:String, hp:int)
{
	GameObject.Find(hive).GetComponent(HiveScript).SetHP(hp);
	
}