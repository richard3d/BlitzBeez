#pragma strict

var m_Lifetime : float = 0;
function Start () {

	if(GetComponent(UpdateScript) != null)
		GetComponent(UpdateScript).enabled = false;
}

function Update () {

	if(m_Lifetime > 0)
		m_Lifetime -= Time.deltaTime;
	else
		Destroy(this);

}

function OnDestroy()
{
	GetComponent(UpdateScript).enabled = true;
}