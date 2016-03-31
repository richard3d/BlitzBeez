#pragma strict
var m_BurningEffect:GameObject = null;
private var m_InjuryTimer:float = 1.5;
private var m_NumDashes:int = 0;
private var m_DashTimer:float = 0;
private var m_WasDashing;


function Start () {

	GetComponent(BeeScript).SetHP(GetComponent(BeeScript).m_HP-1);
	m_BurningEffect = GameObject.Instantiate(GetComponent(BeeScript).m_BurningEffect, transform.position, Quaternion.identity);
	m_BurningEffect.name = "fire";
	m_BurningEffect.transform.parent = transform;
	GetComponent(BeeScript).m_Camera.GetComponent(MotionBlur).enabled = true;

}

function Update () {

	if(GetComponent(BeeDashDecorator) == null)
		m_WasDashing = false;
	else if(!m_WasDashing)
	{
		m_WasDashing = true;
		if(m_NumDashes == 0)
			m_DashTimer = Time.time;
		if(Time.time - m_DashTimer <= 1 && m_NumDashes >= 1)
		{
			if(Network.isServer)
			{
				ServerRPC.Buffer(GetComponent.<NetworkView>(),"RemoveComponent", RPCMode.All, "BurningDecorator");
			}
		}
		m_NumDashes++;
	}
	
	if(Network.isServer)
	{
		if(m_InjuryTimer > 0)
		{
			m_InjuryTimer -= Time.deltaTime;
			if(m_InjuryTimer <= 0)
			{
				m_InjuryTimer = 1.5;
				var m_HP:int = GetComponent(BeeScript).m_HP;
				if(m_HP - 1 <= 0)
				{
					GetComponent.<NetworkView>().RPC("SendGameEventMessage", RPCMode.All, NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name+" burned to a crisp");
					GetComponent(BeeScript).KillAndRespawn(true, null);
				}
				else
				{
					GetComponent.<NetworkView>().RPC("SetHP", RPCMode.All, m_HP - 1);
				}
			}
		}
		
	}
}

function OnDestroy()
{
	m_BurningEffect.transform.parent = null;
	m_BurningEffect.GetComponent.<Renderer>().enabled = true;
	m_BurningEffect.GetComponent(ParticleSystem).enableEmission = false;
	m_BurningEffect.GetComponent(ParticleAutoDestructScript).enabled = true;
	m_BurningEffect.GetComponent(ParticleAutoDestructScript).m_Lifetime = 2;
	
	GetComponent(BeeScript).m_Camera.GetComponent(MotionBlur).enabled = false;
}

