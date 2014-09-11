#pragma strict
private var m_Lifetime : float = 0.0;
private var m_AnimTime : float = 0.25;
private var m_OrigScale = Vector3(1,1,1);
function Awake()
{
	m_Lifetime = 2.0;
	gameObject.AddComponent(ControlDisablerDecorator);
	
	renderer.enabled = true;
	collider.enabled = false;
	
	//GetComponentInChildren(Projector).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = false;
}

function Start () {

		var go:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/WaterRippleParticles"));
		go.transform.position = transform.position;
		go.transform.position.y = 1;
		m_OrigScale = transform.localScale;

}

function Update () {
	
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		gameObject.GetComponent(BeeScript).enabled = false;
		transform.position = Vector3(transform.position.x, Mathf.Lerp(transform.position.y, -20, 1-m_Lifetime/1.5), transform.position.z);
		transform.localScale = Vector3(Mathf.Lerp(transform.localScale.x, 0, 1-m_Lifetime/1.5), Mathf.Lerp(transform.localScale.y, 0, 1-m_Lifetime/1.5), Mathf.Lerp(transform.localScale.z, 0, 1-m_Lifetime/1.5));
		if(m_Lifetime <= 0.0)
		{		
			//respawn
			if(Network.isServer)
			 {
				 ServerRPC.Buffer(networkView,"SetHP", RPCMode.All, 0);
				 ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "DrowningDecorator");
				 
			 }
		}
	}
	
	
}

function SetLifetime(time : float)
{
	m_Lifetime = time;
}

function OnDestroy()
{
	transform.localScale = m_OrigScale;
	
}