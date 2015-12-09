#pragma strict
private var m_Lifetime: float = 1.5;
var m_LightEffect : GameObject;
var m_LightSpot : GameObject;
var m_SayainEffect : GameObject;
function Start () {
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		//m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;
		gameObject.GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).Shake(1.5,0.35);
		var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
		txt.GetComponent(GUIText).text = "Special Attack Ready!";
		txt.layer = LayerMask.NameToLayer("GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1));
	}
	
	if(GetComponent(FlasherDecorator) == null)
	{
		gameObject.AddComponent(FlasherDecorator);
		GetComponent(FlasherDecorator).m_AffectedObj = transform.Find("Bee/NewBee/BeeArmor").gameObject;
		GetComponent(FlasherDecorator).m_FlashDuration = 0.06;
		GetComponent(FlasherDecorator).m_NumberOfFlashes = 999999;
	}	
	
	m_SayainEffect = GameObject.Instantiate(Resources.Load("GameObjects/SaiyanParticles"));
	m_SayainEffect.name = "SaiyanParticles";
	m_SayainEffect.transform.position = transform.position;
	m_SayainEffect.transform.parent = transform;
	m_SayainEffect.transform.localPosition.y = -3;
	
	m_LightEffect = GameObject.Instantiate(Resources.Load("GameObjects/CircularLightBeam"), transform.position, Quaternion.identity);
	m_LightEffect.animation.Play();
	m_LightEffect.transform.parent = gameObject.transform;

	//this one deletes itself the other two (above and below) do not
	var m_TeleportEffect:GameObject= GameObject.Instantiate(Resources.Load("GameObjects/TeleporterParticles"),transform.position, Quaternion.identity);
	m_TeleportEffect.transform.eulerAngles = Vector3(270,0,0);
	m_TeleportEffect.transform.parent = gameObject.transform;
	
	m_LightSpot = GameObject.Instantiate(Resources.Load("GameObjects/TeleportParticles"));
	m_LightSpot.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*0.1;
	m_LightSpot.transform.parent = gameObject.transform;

}

function Update () {

	if(m_Lifetime > 0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0)
		{
			Destroy(m_LightSpot);
			Destroy(m_LightEffect);
			//if(Network.isServer)
			//	ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "LevelUpDecorator");
		}
	}
}

function OnDestroy()
{
	if(m_LightSpot != null)
	{
		Destroy(m_LightSpot);
	}
	
	if(m_LightEffect != null)
	{
		Destroy(m_LightEffect);
	}
	
	if(m_SayainEffect != null)
		Destroy(m_SayainEffect);
}