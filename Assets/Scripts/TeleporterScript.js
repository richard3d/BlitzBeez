#pragma strict
private static var m_InstanceID : int = 0;
var m_ExitTeleporter : GameObject;
var m_TeleportSound:AudioClip;
function Awake()
{
	gameObject.name = "Teleporter"+ ++m_InstanceID;
}

function Start () {

}

function Update () {

}



function OnTriggerEnter(other : Collider)
{
	if(other.gameObject.tag == "Player" && other.gameObject.GetComponent(TeleportDecorator) == null)
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