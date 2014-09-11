//this script is intended to behave like a decorator

#pragma strict

private var  m_PrevSpeed : float;
private var  m_Lifetime : float = 0.15;
private var m_MaxSpeed : float;
private var m_Disabled : boolean = false;
function Awake()
{
	
}

function Start () {
	m_PrevSpeed = GetComponent(UpdateScript).m_MaxSpeed;
	m_MaxSpeed = m_PrevSpeed * 4.0;
	GetComponent(TrailRenderer).enabled = true;
	
	var parts : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/BeeDashParticles"));
	parts.GetComponent(ParticleSystem).renderer.material.color = Color.white;
	parts.transform.position = transform.position;
	parts.transform.parent = transform;
	
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_DashSound, Camera.main.transform.position);
	
}

function Update () {
	GetComponent(TrailRenderer).enabled = true;
	if(m_Disabled)
		return;
	m_Lifetime -= Time.deltaTime;
	GetComponent(UpdateScript).m_MaxSpeed = m_MaxSpeed;
	GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized * m_MaxSpeed;
	
	
	if(m_Lifetime <= 0.0)
	{
		
		Destroy(this);
	}
	else
	{
		
	}
}

function Disable()
{
	m_Disabled = true;
	GetComponent(UpdateScript).m_MaxSpeed = m_PrevSpeed;
	//GetComponent(TrailRenderer).enabled = false;
}

function OnDestroy()
{

	GetComponent(UpdateScript).m_MaxSpeed = m_PrevSpeed;
	GetComponent(TrailRenderer).enabled = false;
	
	//GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized * m_PrevSpeed;
}

