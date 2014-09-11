#pragma strict

public var m_Pedestal : GameObject = null;
private var m_HiveTimer : float = 5;
private var m_FirstInput : boolean = true;
public var m_HiveCreated : boolean = false;
private var m_SpeedAddBees : boolean = false;
private var m_ShieldEffect : GameObject = null;



function Awake()
{
	
}

function Start () {

	GetComponent(BeeControllerScript).m_MoveEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
	GetComponent(BeeControllerScript).m_AttackEnabled = false;
	
	var trgt : Transform = transform.Find("PowerShotParticleSystem(Clone)");
	if(trgt != null)
		Destroy(trgt.gameObject);
	
	m_HiveTimer = 3;
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		m_Pedestal.audio.Play();
		Camera.main.animation["CameraLessDramaticZoom"].speed = 1;
		Camera.main.animation.Play("CameraLessDramaticZoom");
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
	
	if(m_Pedestal == null)
		return;
		
	
	
	if(!IN.GetAction(IN.USE))
	{
	
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "PedestalDecorator");
	}
}

function OnGUI()
{
	var width : float = 100;
	var perc : float = Mathf.Min(1, 1 - m_HiveTimer/3);
	perc *= width;
	var pos : Vector3 = Camera.main.WorldToScreenPoint(transform.position+ Vector3.up * transform.localScale.z*6);
	
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{		
			if(!m_HiveCreated)
			{
				//GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y, width, 10), m_Pedestal.GetComponent(HivePedestalScript).BaseTexture);
				//GUI.DrawTexture(Rect(pos.x- width* 0.5,Screen.height-pos.y,perc,10), m_Pedestal.GetComponent(HivePedestalScript).LifeTexture);
				
				width  = 32;
				GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y - width/2, width, width), m_Pedestal.GetComponent(HivePedestalScript).ClockTexture);
				GUIUtility.RotateAroundPivot (Mathf.Min(1, 1 - m_HiveTimer/3)*359,  Vector2(pos.x, Screen.height-pos.y)); 
				GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y- width/2, width, width), m_Pedestal.GetComponent(HivePedestalScript).ClockHandTexture);
			}
		}
		
	
	
}

function Update () {

	if(!m_Pedestal)
		return;
	
	transform.position +=   (m_Pedestal.transform.position + Vector3(0,12,0) - transform.position) * Time.deltaTime * 20;
	transform.position. y = m_Pedestal.transform.position.y + 12;
	
	if(!GetComponent(BeeControllerScript).m_LookEnabled)
		transform.eulerAngles = Vector3(0,0,0);
	
	
	if(m_HiveTimer > 0)
	{
		m_HiveTimer -= Time.deltaTime;
		if((Network.isServer && gameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == gameObject) ||
			Network.isClient && gameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == gameObject)
		{
			var txt : GameObject = gameObject.Find("SwarmCountText");
			txt.transform.position = Camera.main.WorldToViewportPoint(transform.position+ Vector3.up * transform.localScale.z*5);
			txt.transform.position.y += 0.04;
			txt.GetComponent(GUIText).enabled = true;
			//var count : int = m_Flower.GetComponentInChildren(ParticleEmitter).particleCount;
			txt.GetComponent(GUIText).text = "Building  Hive";
		}
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
	Debug.Log("Bye Pedestal Dec");
	gameObject.Destroy(m_ShieldEffect);
	m_Pedestal.audio.Stop();
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
		GetComponent(BeeScript).m_HoneycombCount--;
		Camera.main.GetComponent(CameraScript).Shake(0.25, 1.0);
		//gameObject.networkView.RPC("AddXP", RPCMode.All, 10);
	}
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.animation["CameraLessDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
		Camera.main.animation["CameraLessDramaticZoom"].speed = -1;
		Camera.main.animation.Play("CameraLessDramaticZoom");
	}
}

function SetPedestal(ped : GameObject)
{
	m_Pedestal = ped;
	if(m_Pedestal.transform.Find("Shield") == null)
	{
		m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/Shield"));
		m_ShieldEffect.name = "Shield";
		m_ShieldEffect.transform.position = m_Pedestal.transform.position;
		m_ShieldEffect.transform.parent = m_Pedestal.transform;
		m_ShieldEffect.GetComponent(ParticleSystem).renderer.material.SetColor("_EmisColor", renderer.material.color);
		m_ShieldEffect.GetComponent(ParticleSystem).startColor = gameObject.renderer.material.color;
	}
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