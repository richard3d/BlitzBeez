#pragma strict
private var m_Lifetime: float = 1.5;
private var m_LightEffect:GameObject = null;
private var m_LightSpot:GameObject = null;
function Start () {

	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.animation["CameraDramaticZoom"].time = 0;
		Camera.main.animation["CameraDramaticZoom"].speed = 1;
		Camera.main.animation.Play("CameraDramaticZoom");
		
		Camera.main.GetComponent(CameraScript).Shake(1.5, 1.5);
		Camera.main.GetComponent(MotionBlur).enabled = true;
	}
	//transform.GetChild(0).GetComponent(MeshFilter).mesh = GetComponent(BeeScript).m_Meshes[1];
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
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.animation["CameraDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
		Camera.main.animation["CameraDramaticZoom"].speed = -1;
		Camera.main.animation.Play("CameraDramaticZoom");
		Camera.main.GetComponent(MotionBlur).enabled = false;
	//	Destroy(Camera.main.transform.gameObject.GetComponent(MotionBlur));
	}
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	//Destroy(GetComponent(PauseDecorator));
	GetComponent(UpdateScript).enabled = true;
	Destroy(m_LightEffect);
	Destroy(m_LightSpot);
}