#pragma strict
var m_Pos : Vector3;	//if no attached object below then this will be treated as the world space position, otherwise it is relative to the attached object
var m_Color:Color = Color.white;
var m_Delay:float = 0;
var m_CameraOwner:GameObject;
var m_AttachedObject : GameObject = null; //if null just uses the set world position 
function Start () {



}

function Update () {

	if(m_Delay > 0)
	{
		m_Delay -= Time.deltaTime;
		GetComponent(GUIText).enabled = false;
		GetComponent.<Animation>().Stop();
		if(m_Delay <= 0)
		{
			GetComponent(UpdateScript).m_Lifetime = 2;
			GetComponent.<Animation>().Play();
			GetComponent(GUIText).enabled = true;
		}
	}
	else
	{
		m_Pos += Vector3.up*20*Time.deltaTime;
		
		GetComponent(GUIText).material.color = m_Color;
		
		if(m_CameraOwner != null)
		{
			if(m_AttachedObject != null)
			{
				if(Vector3.Dot(m_CameraOwner.transform.forward, (m_AttachedObject.transform.position + m_Pos - m_CameraOwner.transform.position).normalized) > 0)
					gameObject.transform.position = m_CameraOwner.GetComponent.<Camera>().WorldToViewportPoint(m_AttachedObject.transform.position + m_Pos);
			}
			else
			{
				if(Vector3.Dot(m_CameraOwner.transform.forward, (m_Pos - m_CameraOwner.transform.position).normalized) > 0)
					gameObject.transform.position = m_CameraOwner.GetComponent.<Camera>().WorldToViewportPoint(m_Pos);
			}
		}
	}

}