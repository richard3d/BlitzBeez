#pragma strict

var m_Lifetime : float = 0;
private var m_PrevVel:Vector3;
private var m_PrevAngVel:Vector3;
private var m_PrevAccel:Vector3;
private var m_PrevAnimating : boolean = false;
function Start () {

	if(GetComponent(UpdateScript) != null)
	{
		//GetComponent(UpdateScript).enabled = false;
		m_PrevVel = GetComponent(UpdateScript).m_Vel;
		m_PrevAccel = GetComponent(UpdateScript).m_Accel;
		m_PrevAngVel = GetComponent(UpdateScript).m_AngVel;
		
		if(animation != null && animation.isPlaying)
		{
			animation.Stop();
			m_PrevAnimating = true;
		}
	}
}

function Update () {

	if(m_Lifetime > 0)
	{
		m_Lifetime -= Time.deltaTime;
		GetComponent(UpdateScript).m_Vel = Vector3.zero;
		GetComponent(UpdateScript).m_Accel= Vector3.zero;
		GetComponent(UpdateScript).m_AngVel= Vector3.zero;
	
	}
	else
	{
		
		if(Network.isServer)
				ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "PauseDecorator");
	}

}

function OnDestroy()
{
	
	GetComponent(UpdateScript).m_Vel =  m_PrevVel;
	GetComponent(UpdateScript).m_Accel=  m_PrevAccel;
	GetComponent(UpdateScript).m_AngVel=  m_PrevAngVel;
	
	if(animation != null && m_PrevAnimating)
	{
		animation.Play();
	}
}