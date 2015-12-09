#pragma strict
private var m_Lifetime: float = 1.5;
private var m_PlayerCam:GameObject = null;
private var m_OrigCamOffset : Vector3;
function Start () {

	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;
	//	m_PlayerCam.GetComponent(CameraScript).Shake(1.5,0.35);
	}

	//this one deletes itself the other two (above and below) do not
	var levelUpEffect:GameObject= GameObject.Instantiate(Resources.Load("GameObjects/LevelUpParticles"),transform.position, Quaternion.identity);
	levelUpEffect.transform.eulerAngles = Vector3(270,0,0);
	levelUpEffect.transform.parent = gameObject.transform;
}

function Update () {
	//GetComponent(BeeScript).SetColor(GetComponent(BeeScript).m_Color);
	if(m_Lifetime > 0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0)
		{
			if(Network.isServer)
				ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "LevelUpDecorator");
		}
	}

}

function OnDestroy()
{
	
	GetComponent(BeeScript).m_CurrXP = 0;
	GetComponent(BeeScript).m_CurrLevel++;
	
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	//Destroy(GetComponent(PauseDecorator));
	GetComponent(UpdateScript).enabled = true;

}