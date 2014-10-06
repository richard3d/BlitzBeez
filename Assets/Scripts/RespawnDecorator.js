#pragma strict
private var m_Lifetime : float = 0.0;
private var m_AnimTime : float = 0.25;
var m_RespawnPos = Vector3(0,350,0);
function Awake()
{
	gameObject.AddComponent(ControlDisablerDecorator);
	
	renderer.enabled = false;
	collider.enabled = false;
	GetComponentInChildren(TrailRenderer).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = false;
}

function Start () {

	if(NetworkUtils.IsControlledGameObject(gameObject))
		Camera.main.GetComponent(CameraScript).m_Freeze = true;

}

function Update () {
	
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0.0)
		{		
			//find respawn position;
			//start animating
			renderer.enabled = true;
		}
	}
	
	if(m_Lifetime <= 0)
	{
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			//Camera.main.GetComponent(CameraScript).m_Freeze = false;
			Camera.main.transform.position = m_RespawnPos +200*Vector3.up-transform.forward*200;
			Camera.main.transform.position.y = 200;
			Camera.main.transform.LookAt(Vector3(m_RespawnPos.x,0,m_RespawnPos.z));
			Camera.main.GetComponent(CameraScript).m_CamPos = Camera.main.transform.position;
		}
		gameObject.GetComponent(BeeScript).enabled = false;
		
		transform.position = Vector3(m_RespawnPos.x, Mathf.Lerp(m_RespawnPos.y, 5, 1-m_AnimTime/0.25), m_RespawnPos.z);
		GetComponent(TrailRenderer).enabled = true;
		m_AnimTime -= Time.deltaTime;
		if(m_AnimTime <= 0)
		{
			if(Network.isServer)
			{
				networkView.RPC("RemoveComponent", RPCMode.All, "RespawnDecorator");
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
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.GetComponent(CameraScript).m_Freeze = false;
	}
	
	GetComponent(BeeScript).m_HP = 3;
	collider.enabled = true;
	gameObject.transform.localScale = Vector3(2,2,2);
	//gameObject.animation.Play("SpawnPlayer");
	
	Destroy(GetComponent(ControlDisablerDecorator));
	GetComponent(BeeScript).enabled = true;
	GetComponent(TrailRenderer).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = true;
	GetComponent(BeeControllerScript).Reload();
	GetComponent(BeeControllerScript).QuickReload();
}