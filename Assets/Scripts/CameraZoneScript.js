#pragma strict
var m_Offset:Vector3;

function Start () {

}

function Update () {

}



function OnTriggerStay(coll:Collider)
{
	if(NetworkUtils.IsControlledGameObject(coll.gameObject))
	{
		Camera.main.GetComponent(CameraScript).m_Offset = m_Offset;
	}
}


function OnTriggerExit(coll:Collider)
{
	
	if(NetworkUtils.IsControlledGameObject(coll.gameObject))
	{
		Camera.main.GetComponent(CameraScript).m_Offset = Camera.main.GetComponent(CameraScript).m_DefaultOffset ;
	}
	
}