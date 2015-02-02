#pragma strict
private var m_Lifetime : float = 0.0;
private var m_AnimTime : float = 0.25;
private var m_TeleTime : float = 3;
private var m_FirstInput:boolean = true;
private var m_TeleportEffect:GameObject =null;
private var m_BaseSize:float;

var m_TelePos = Vector3(0,350,0);
var m_ReturnToBase : boolean = false; //is this a return to base teleport or a standard teleport from a t-pad?
function Start()
{
	
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(BeeScript).enabled = false;
	
	if(m_ReturnToBase)
	{
		m_TeleportEffect= GameObject.Instantiate(Resources.Load("GameObjects/TeleportParticles"));
		m_TeleportEffect.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*0.1;
		
		m_BaseSize = m_TeleportEffect.transform.localScale.x;
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			Camera.main.GetComponent(CameraScript).Shake(m_TeleTime,0.75);
			//Camera.main.GetComponent(MotionBlur).enabled = true;
		}
	}	
	else
	{
		GetComponent(BeeScript).Show(false);
		m_TeleTime = 0.1;
	}
	
}


function OnNetworkInput(IN : InputState)
{
	
	if(!networkView.isMine)
	{
		return;
	}
	
	if(m_FirstInput)
	{
		 m_FirstInput = false;
		return;
	}
	
	
	if(!IN.GetAction(IN.DASH) && m_ReturnToBase)
	{
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "TeleportDecorator");
		
	}
	
	
}

function Update () {
	
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	
	if(m_TeleTime > 0)
	{
		m_TeleTime -= Time.deltaTime;
		if(m_TeleportEffect != null)
			m_TeleportEffect.transform.localScale -= Time.deltaTime * Vector3(m_BaseSize,m_BaseSize,0.01)/6;
		if(m_TeleTime <= 0)
		{
			
			gameObject.AddComponent(ControlDisablerDecorator);
			GetComponent(BeeScript).Show(false);
			collider.enabled = false;
			GetComponentInChildren(TrailRenderer).enabled = false;
			
			var go:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/PickupEffect"),transform.position,Quaternion.identity);
			go.GetComponent(ParticleSystem).startSize = 8;
			if(NetworkUtils.IsControlledGameObject(gameObject) && m_ReturnToBase)
			{
				Camera.main.GetComponent(CameraScript).Shake(0.75,2);
			//	Camera.main.GetComponent(MotionBlur).enabled = false;
			}
			//if(NetworkUtils.IsControlledGameObject(gameObject))
			//	Camera.main.GetComponent(CameraScript).m_Freeze = true;
			//m_TeleportEffect.GetComponent(ParticleSystem).startSpeed = 200;
			if(m_TeleportEffect != null)
			{
				m_TeleportEffect.GetComponent(MeshRenderer).enabled = false;
				m_TeleportEffect.GetComponent(ParticleSystem).emissionRate = 0;
				for(var child:Transform in m_TeleportEffect.transform)
				{
				//	child.GetComponent(ParticleSystem).startSpeed = 200;
					child.GetComponent(ParticleSystem).emissionRate = 0;
				}
			}
			

		}
		return;
	}
	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0.0)
		{		
			//find respawn position;
			//start animating
			GetComponent(BeeScript).Show(true);
			
			
		}
	}
	
	if(m_Lifetime <= 0)
	{
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			//Camera.main.GetComponent(CameraScript).m_Freeze = false;
			Camera.main.transform.position = m_TelePos -100*Vector3.up-transform.forward*200;
			//Camera.main.transform.position.y = 200;
			Camera.main.transform.LookAt(Vector3(m_TelePos.x,m_TelePos.y-350,m_TelePos.z));
			Camera.main.GetComponent(CameraScript).m_CamPos = Camera.main.transform.position;
			
		}
		if(m_TeleportEffect != null)
			Destroy(m_TeleportEffect);
		
	//	gameObject.GetComponent(BeeScript).enabled = false;
		
		
		
		GetComponent(TrailRenderer).enabled = true;
		m_AnimTime -= Time.deltaTime;
		m_AnimTime = Mathf.Max(0,m_AnimTime);
		transform.position = Vector3(m_TelePos.x, Mathf.Lerp(m_TelePos.y, m_TelePos.y-350 + GetComponent(CharacterController).height+0.1, 1-m_AnimTime/0.25), m_TelePos.z);
		
		if(m_AnimTime <= 0)
		{
			if(Network.isServer)
			{
				AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_RespawnSound, Camera.main.transform.position);
				ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "TeleportDecorator");
				
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
	if(NetworkUtils.IsControlledGameObject(gameObject)&& m_ReturnToBase)
	{
		Camera.main.GetComponent(CameraScript).m_Freeze = false;
		Camera.main.GetComponent(CameraScript).Shake(0.25,1);
		//Camera.main.GetComponent(MotionBlur).enabled = false;
	}
	if(m_TeleportEffect != null)
			Destroy(m_TeleportEffect);
	
	collider.enabled = true;
	gameObject.transform.localScale = Vector3(2,2,2);
	//gameObject.animation.Play("SpawnPlayer");
	
	Destroy(GetComponent(ControlDisablerDecorator));
	GetComponent(BeeScript).enabled = true;
	GetComponent(TrailRenderer).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = true;
}