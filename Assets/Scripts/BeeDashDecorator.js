//this script is intended to behave like a decorator

#pragma strict

private var  m_PrevSpeed : float;
private var  m_Lifetime : float = 0.25;
private var m_MaxSpeed : float;
private var m_Disabled : boolean = false;
private var m_TracerParticles:GameObject = null;
function Awake()
{
	
}

function Start () {
	m_PrevSpeed = GetComponent(UpdateScript).m_MaxSpeed;
	m_MaxSpeed = m_PrevSpeed * 4.0;
	GetComponent(UpdateScript).m_MaxSpeed = m_MaxSpeed;
	GetComponent(TrailRenderer).enabled = true;
	//Debug.Log(m_MaxSpeed);
	m_TracerParticles = gameObject.Instantiate(Resources.Load("GameObjects/BeeDashTracerParticles"),transform.position, Quaternion.identity);
	m_TracerParticles.transform.parent = transform;
	m_TracerParticles.transform.rotation = m_TracerParticles.transform.parent.rotation;
	m_TracerParticles.GetComponent(ParticleSystem).startRotation = Mathf.Acos(Vector3.Dot(transform.forward,Vector3.forward));
	
	 if(transform.forward.x < 0)
		 m_TracerParticles.GetComponent(ParticleSystem).startRotation = 2*Mathf.PI-m_TracerParticles.GetComponent(ParticleSystem).startRotation;
	m_TracerParticles.GetComponent(ParticleSystem).startRotation += 0.785;
	
	
	
	// m_TracerParticles = gameObject.Instantiate(Resources.Load("GameObjects/BeeDashEffectParticles"),transform.position, Quaternion.identity);
	// m_TracerParticles.transform.parent = transform;
	// m_TracerParticles.GetComponent(ParticleSystem).startRotation = Mathf.Acos(Vector3.Dot(GetComponent(UpdateScript).m_Vel.normalized,Vector3.forward));
	
	 // if(GetComponent(UpdateScript).m_Vel.x < 0)
		 // m_TracerParticles.GetComponent(ParticleSystem).startRotation = 2*Mathf.PI-m_TracerParticles.GetComponent(ParticleSystem).startRotation;
	// m_TracerParticles.GetComponent(ParticleSystem).startRotation += 0.785;
	
	var parts : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/BeeDashParticles"),transform.position, Quaternion.identity);
	parts.GetComponent(ParticleSystem).renderer.material.color = Color.white;
	parts.transform.position = transform.position;
	parts.transform.parent = transform;
	
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_DashSound, Camera.main.transform.position);
	
}

function OnNetworkInput(IN : InputState)
{
	if(!networkView.isMine)
	{
		return;
	}
	
	// if(IN.GetAction(IN.DASH))
	// {
	
		// if(Mathf.Abs(m_PrevSpeed - m_MaxSpeed) > 0.1 )
		// {
			// m_Lifetime	= 0.25;
			// m_MaxSpeed += (m_PrevSpeed - m_MaxSpeed) * Time.deltaTime*4;
		// }
		// else
			// m_Lifetime = 0;
	// }
}

function Update () {
	GetComponent(TrailRenderer).enabled = true;
	if(m_Disabled)
		return;
	m_Lifetime -= Time.deltaTime;
	GetComponent(UpdateScript).m_MaxSpeed = m_MaxSpeed;
	GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized * m_MaxSpeed;
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		//Camera.main.fov = 45 + (1-Mathf.Abs(((m_Lifetime/0.25)*2-1)))*3;
	}
	
	// if(Vector3.Dot(transform.right, GetComponent(UpdateScript).m_Vel.normalized) > 0.3)
		// transform.eulerAngles.z = m_Lifetime / 0.25 * 359;
	// else if(Vector3.Dot(transform.right, GetComponent(UpdateScript).m_Vel.normalized) < -0.3)
		// transform.eulerAngles.z = m_Lifetime / 0.25 * -359;
	
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

function Reset()
{
	m_Lifetime = 0.25;
}

function OnDestroy()
{

	//if(GetComponent(UpdateScript).m_MaxSpeed != GetComponent(UpdateScript).m_DefaultMaxSpeed || m_MaxSpeed == GetComponent(UpdateScript).m_DefaultMaxSpeed)
	GetComponent(UpdateScript).m_MaxSpeed = GetComponent(UpdateScript).m_DefaultMaxSpeed;
	GetComponent(TrailRenderer).enabled = false;
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		//Camera.main.fov = 45;
	}
	
	//GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized * m_PrevSpeed;
}

