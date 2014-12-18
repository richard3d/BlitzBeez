#pragma strict

var m_StartScale: Vector3;
var m_EndScale: Vector3;
var m_StartColor: Color;
var m_EndColor: Color;
var m_Lifetime:float = 1.25;
private var m_Lifetimer:float = 0;

function Start () {
m_Lifetimer = m_Lifetime;
}

function Update () {

	
	if(m_Lifetimer > 0)
	{
		m_Lifetimer -= Time.deltaTime;
		
		if(m_Lifetimer <= 0)
			Destroy(gameObject);
		else
		{
			transform.localScale = Vector3.Lerp(m_EndScale, m_StartScale, m_Lifetimer/m_Lifetime);
			renderer.material.SetColor("_TintColor",Color.Lerp(m_EndColor, m_StartColor,m_Lifetimer/m_Lifetime));
		}
	}

}