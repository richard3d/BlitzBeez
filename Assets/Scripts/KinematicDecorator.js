#pragma strict
var m_Lifetime:float = 0;
var m_VelScalar:float = 0;
function Start () {
	yield DoStuff();
}

function DoStuff()
{
	var delta:float = 0.033;
	while(m_Lifetime > 0)
	{
		m_Lifetime -= delta;
		GetComponent(UpdateScript).m_Vel -= transform.forward * GetComponent(UpdateScript).m_MaxSpeed * m_VelScalar;
		yield WaitForSeconds(delta);
	}
	Destroy(gameObject.GetComponent(KinematicDecorator));
}

function Update () {

}