#pragma strict

public var m_Pedestal : GameObject = null;
private var m_HiveTimer : float = 5;
private var m_FirstInput : boolean = true;
public var m_HiveCreated : boolean = false;
private var m_SpeedAddBees : boolean = false;
private var m_ShieldEffect : GameObject = null;
var m_ProgressEffect : GameObject = null;
private var m_Camera:GameObject = null;

function Awake()
{
	
}

function Start () {

	m_Camera = GetComponent(BeeScript).m_Camera;
	GetComponent(BeeControllerScript).m_MoveEnabled = false;
	transform.GetChild(0).localEulerAngles.z = 0;
	//GetComponent(BeeControllerScript).m_AttackEnabled = false;
	
	var trgt : Transform = transform.Find("PowerShotParticleSystem(Clone)");
	if(trgt != null)
		Destroy(trgt.gameObject);
	
	m_HiveTimer = 3;
	
	
	m_ProgressEffect = GameObject.Instantiate(m_Pedestal.GetComponent(HivePedestalScript).m_ProgressEffectInstance);
	m_ProgressEffect.transform.position = m_Pedestal.transform.position + Vector3.up * 6;
	m_ProgressEffect.transform.localScale = Vector3(25,0,25);
	m_ProgressEffect.renderer.material.SetColor("_Emission", NetworkUtils.GetColor(gameObject));
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		//m_Pedestal.audio.Play();
		m_Camera.animation["CameraLessDramaticZoom"].speed = 1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	}
	
	var color = NetworkUtils.GetColor(gameObject);
	m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/FlowerShield"),m_Pedestal.transform.position + Vector3.up * 16,Quaternion.identity);
	m_ShieldEffect.name = "FlowerShield";
	m_ShieldEffect.transform.localEulerAngles = Vector3(0,180,0);
	m_ShieldEffect.animation.Play();
	m_ShieldEffect.GetComponent(FlowerShieldScript).m_Owner = gameObject;
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
	
	if(m_Pedestal == null)
		return;
		
	
	
	if(!IN.GetAction(IN.USE))
	{
	
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "PedestalDecorator");
	}
}

function OnGUI()
{
	// var width : float = 100;
	// var perc : float = Mathf.Min(1, 1 - m_HiveTimer/3);
	// perc *= width;
	// var pos : Vector3 = m_Camera.WorldToScreenPoint(transform.position+ Vector3.up * transform.localScale.z*6);
	
		 if(NetworkUtils.IsLocalGameObject(gameObject))
		 {		
			 if(!m_HiveCreated)
			 {
				var pos : Vector3 = m_Camera.camera.WorldToScreenPoint(m_Pedestal.transform.position + Vector3.up * transform.localScale.z*6);
				GUI.DrawTexture(Rect(pos.x - 100,Screen.height-pos.y +100, 200, 55), m_Pedestal.GetComponent(HivePedestalScript).m_BuildingTexture);
				// //GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y, width, 10), m_Pedestal.GetComponent(HivePedestalScript).BaseTexture);
				// //GUI.DrawTexture(Rect(pos.x- width* 0.5,Screen.height-pos.y,perc,10), m_Pedestal.GetComponent(HivePedestalScript).LifeTexture);
				
				// width  = 32;
				// GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y - width/2, width, width), m_Pedestal.GetComponent(HivePedestalScript).ClockTexture);
				// GUIUtility.RotateAroundPivot (Mathf.Min(1, 1 - m_HiveTimer/3)*359,  Vector2(pos.x, Screen.height-pos.y)); 
				// GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y- width/2, width, width), m_Pedestal.GetComponent(HivePedestalScript).ClockHandTexture);
			 }
		}
		
	
	
}

function Update () {

	if(!m_Pedestal)
		return;
		
	if(m_ShieldEffect != null)
	{
		m_ShieldEffect.transform.rotation = transform.rotation;
		m_ShieldEffect.transform.localEulerAngles.y += 180;
		
	}	
		
	GetComponent(UpdateScript).m_Vel = Vector3.zero;
	transform.position +=   (m_Pedestal.transform.position + Vector3(0,12,0) - transform.position) * Time.deltaTime * 20;
	transform.position. y = m_Pedestal.transform.position.y + 12;
		
	
	if(m_HiveTimer > 0)
	{
		if(m_ProgressEffect != null)
			m_ProgressEffect.renderer.material.SetFloat("_Cutoff", Mathf.Min(m_HiveTimer/3,1));
		m_HiveTimer -= Time.deltaTime;
		// if((Network.isServer && gameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == gameObject) ||
			// Network.isClient && gameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == gameObject)
		// {
			// var txt : GameObject = gameObject.Find("SwarmCountText");
			// txt.transform.position = m_Camera.WorldToViewportPoint(transform.position+ Vector3.up * transform.localScale.z*5);
			// txt.transform.position.y += 0.04;
			// txt.GetComponent(GUIText).enabled = true;
			// //var count : int = m_Flower.GetComponentInChildren(ParticleEmitter).particleCount;
			// txt.GetComponent(GUIText).text = "Building  Hive";
		// }
	}
	else
	{
		if(Network.isServer)
		{
			ServerRPC.Buffer(networkView, "CreateHive", RPCMode.All, transform.position + Vector3(0,16,0));
			ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "PedestalDecorator");
			return;
		}
	
	}
	
}



function OnDestroy()
{
	Destroy(m_ShieldEffect);
//	m_Pedestal.audio.Stop();
	GetComponent(BeeControllerScript).m_MoveEnabled = true;
	GetComponent(BeeControllerScript).m_LookEnabled = true;
	GetComponent(BeeControllerScript).m_AttackEnabled = true;
	
	gameObject.Find("SwarmCountText").GetComponent(GUIText).enabled = false;
	if(!m_HiveCreated)
	{
	     m_Pedestal.GetComponent(HivePedestalScript).m_Activated = false;
		 m_Pedestal.renderer.material.mainTexture = m_Pedestal.GetComponent(HivePedestalScript).m_TempTexture;
	}
	
	if(Network.isServer && m_HiveCreated)
	{
		m_Camera.GetComponent(CameraScript).Shake(0.25, 1.0);
	}
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
		m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	}
	Destroy(m_ProgressEffect);
}

function SetPedestal(ped : GameObject)
{
	m_Pedestal = ped;
}

function GetPedestal() : GameObject
{
	return m_Pedestal;
}



// @RPC function RemovePedestalDecorator()
// {
	// if(!m_HiveCreated)
	// {
		// m_Pedestal.GetComponent(HivePedestalScript).m_Activated = false;
		// m_Pedestal.renderer.material.mainTexture = m_Pedestal.GetComponent(HivePedestalScript).m_TempTexture;
	// }
	
	// Destroy(this);
// }