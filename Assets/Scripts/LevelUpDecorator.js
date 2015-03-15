#pragma strict
private var m_Lifetime: float = 1.5;
private var m_LightEffect:GameObject = null;
private var m_LightSpot:GameObject = null;
private var m_PlayerCam:GameObject = null;
function Start () {

	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;
		m_PlayerCam.animation["CameraDramaticZoom"].time = 0;
		m_PlayerCam.animation["CameraDramaticZoom"].speed = 1;
		m_PlayerCam.animation.Play("CameraDramaticZoom");
		
		m_PlayerCam.GetComponent(CameraScript).Shake(1.5, 1.5);
		m_PlayerCam.GetComponent(MotionBlur).enabled = true;
	}
	Destroy(transform.GetChild(0).gameObject);
	var newBee:GameObject = GameObject.Instantiate(GetComponent(BeeScript).m_Meshes[GetComponent(BeeScript).m_CurrLevel-1]);
	newBee.name = "Bee";
	newBee.transform.parent = gameObject.transform;//.GetComponent(MeshFilter).mesh;
	newBee.transform.eulerAngles = gameObject.transform.eulerAngles;
	//transform.GetChild(0).renderer.materials = GetComponent(BeeScript).m_Meshes[0].renderer.materials;
	//transform.GetChild(0).localScale = GetComponent(BeeScript).m_Meshes[0].transform.localScale;
	
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
		m_PlayerCam.animation["CameraDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
		m_PlayerCam.animation["CameraDramaticZoom"].speed = -1;
		m_PlayerCam.animation.Play("CameraDramaticZoom");
		m_PlayerCam.GetComponent(MotionBlur).enabled = false;
	}
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	//Destroy(GetComponent(PauseDecorator));
	GetComponent(UpdateScript).enabled = true;
	Destroy(m_LightEffect);
	Destroy(m_LightSpot);
}