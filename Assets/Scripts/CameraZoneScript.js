#pragma strict
var m_Offset:Vector3;

function Start () {

}

function Update () {

}



function OnTriggerStay(coll:Collider)
{
	if(coll.gameObject.tag == "Player")
	{
		
		if(NetworkUtils.IsLocalGameObject(coll.gameObject))
		{
			coll.gameObject.GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_Offset = m_Offset;
		}
	}
}


function OnTriggerExit(coll:Collider)
{
	if(coll.gameObject.tag == "Player")
	{
		if(NetworkUtils.IsLocalGameObject(coll.gameObject))
		{
			coll.gameObject.GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_Offset = coll.gameObject.GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_DefaultOffset ;
		}
	}
	
}