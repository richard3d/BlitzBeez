#pragma strict
var m_ActivatedTexture : Texture2D = null;
var m_Colliding : boolean = false;
var m_Activated : boolean = false;
private var m_NumColliding : int = 0;
var m_TempTexture : Texture2D;

var LifeTexture : Texture2D = null;
var BaseTexture : Texture2D = null;
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

function OnTriggerExit(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
	}
}

function Activate()
{
	m_TempTexture = renderer.material.mainTexture;
	renderer.material.mainTexture = m_ActivatedTexture;
	m_Activated = true;
}

