#pragma strict
private var m_Lifetime: float = 1.5;
private var m_LightEffect:GameObject = null;
private var m_LightSpot:GameObject = null;
private var m_PlayerCam:GameObject = null;
private var m_OrigCamOffset : Vector3;
function Start () {

	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;
		
		m_OrigCamOffset = m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset;
		m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset = Vector3(0,23,-26);
		m_PlayerCam.GetComponent(CameraScript).m_Pitch = 30;
		m_PlayerCam.GetComponent(MotionBlur).enabled = true;
		m_PlayerCam.GetComponent(DepthOfFieldScatter).enabled = false;
		m_PlayerCam.GetComponent(CameraScript).Shake(1.5,0.35);
	}

	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Play("celebrate");
	GameObject.Find(gameObject.name+"/Bee/NewBee").transform.localEulerAngles.x = -90;
	transform.GetChild(0).localEulerAngles.z = 0;
	
	m_LightEffect = GameObject.Instantiate(Resources.Load("GameObjects/CircularLightBeam"), transform.position, Quaternion.identity);
	m_LightEffect.animation.Play();
	//m_LightEffect.transform.localScale = Vector3(12,300,12);
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	//gameObject.AddComponent(PauseDecorator);
	GetComponent(UpdateScript).enabled = false;
	//GetComponent(PauseDecorator).m_Lifetime = 99;
	
	//this one deletes itself the other two (above and below) do not
	var m_TeleportEffect:GameObject= GameObject.Instantiate(Resources.Load("GameObjects/TeleporterParticles"),transform.position, Quaternion.identity);
	m_TeleportEffect.transform.eulerAngles = Vector3(270,0,0);
	
	m_LightSpot = GameObject.Instantiate(Resources.Load("GameObjects/TeleportParticles"));
	m_LightSpot.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*0.1;

}

function Update () {
	//GetComponent(BeeScript).SetColor(GetComponent(BeeScript).m_Color);
	if(m_Lifetime > 0)
	{
		m_Lifetime -= Time.deltaTime;
	//	m_LightEffect.transform.localScale = Vector3(12*m_Lifetime,300,12*m_Lifetime);
		if(m_Lifetime <= 0)
		{
			if(Network.isServer)
				ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "LevelUpDecorator");
		}
	}

}

function OnDestroy()
{
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam.GetComponent(MotionBlur).enabled = false;
		m_PlayerCam.GetComponent(DepthOfFieldScatter).enabled = true;
		m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset = m_OrigCamOffset;
		m_PlayerCam.GetComponent(CameraScript).m_Pitch = m_PlayerCam.GetComponent(CameraScript).m_DefaultPitch;
		
	}
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Play("fly");
	GameObject.Find(gameObject.name+"/Bee/NewBee").transform.localEulerAngles.x = 0;
	//
	GetComponent(BeeScript).m_CurrXP = 0;
	GetComponent(BeeScript).m_CurrLevel++;
	
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	//Destroy(GetComponent(PauseDecorator));
	GetComponent(UpdateScript).enabled = true;
	Destroy(m_LightEffect);
	Destroy(m_LightSpot);
}