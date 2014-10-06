#pragma strict
var m_WorldPos : Vector3;
var m_Color:Color = Color.white;
var m_Delay:float = 0;
function Start () {

}

function Update () {

	if(m_Delay > 0)
	{
		m_Delay -= Time.deltaTime;
		GetComponent(GUIText).enabled = false;
		animation.Stop();
		if(m_Delay <= 0)
		{
			GetComponent(UpdateScript).m_Lifetime = 2;
			animation.Play();
			GetComponent(GUIText).enabled = true;
		}
	}
	else
	{
		m_WorldPos += Vector3.up*20*Time.deltaTime;
		GetComponent(GUIText).material.color = m_Color;
		gameObject.transform.position = Camera.main.WorldToViewportPoint(m_WorldPos);
	}

}