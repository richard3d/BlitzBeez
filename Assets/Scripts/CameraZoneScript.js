#pragma strict
var m_Offset:Vector3;
var m_Pitch :float;
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
			var script:BeeScript = coll.gameObject.GetComponent(BeeScript);
			script.m_Camera.GetComponent(CameraScript).m_Offset =  m_Offset;
			script.m_Camera.GetComponent(CameraScript).m_Pitch = m_Pitch;
		}
	}
}


function OnTriggerExit(coll:Collider)
{
	if(coll.gameObject.tag == "Player")
	{
		if(NetworkUtils.IsLocalGameObject(coll.gameObject))
		{
			var script:BeeScript = coll.gameObject.GetComponent(BeeScript);
			script.m_Camera.GetComponent(CameraScript).m_Offset = script.m_Camera.GetComponent(CameraScript).m_DefaultOffset ;
			script.m_Camera.GetComponent(CameraScript).m_Pitch = script.m_Camera.GetComponent(CameraScript).m_DefaultPitch;
		}
	}
	
}