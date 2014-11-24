#pragma strict

var m_Lifetime : float = 0;
private var m_PrevVel:Vector3;
private var m_PrevAccel:Vector3;
function Start () {

	if(GetComponent(UpdateScript) != null)
	{
		GetComponent(UpdateScript).enabled = false;
		m_PrevVel = GetComponent(UpdateScript).m_Vel;
		m_PrevAccel = GetComponent(UpdateScript).m_Accel;
	}
}

function Update () {

	if(m_Lifetime > 0)
	{
		m_Lifetime -= Time.deltaTime;
	}
	else
	{
		if(Network.isServer)
				ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "PauseDecorator");
	}

}

function OnDestroy()
{
	GetComponent(UpdateScript).enabled = true;
}