#pragma strict
var m_WorldPos : Vector3;
var m_Color:Color = Color.white;
function Start () {

}

function Update () {

	m_WorldPos += Vector3.up*20*Time.deltaTime;
	GetComponent(GUIText).material.color = m_Color;
	gameObject.transform.position = Camera.main.WorldToViewportPoint(m_WorldPos);

}