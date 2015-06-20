#pragma strict
private var m_Lifetime : float = 0.0;
private var m_AnimTime : float = 0.25;
var m_RespawnPos = Vector3(0,350,0);
private var m_Camera:GameObject = null;
function Awake()
{
	gameObject.AddComponent(ControlDisablerDecorator);

	GetComponent(BeeScript).Show(false);
	GetComponent(CharacterController).enabled = false;
	GetComponent(SphereCollider).enabled = false;
	GetComponentInChildren(TrailRenderer).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = false;
}

function Start () {

	m_Camera = gameObject.GetComponent(BeeScript).m_Camera;
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		GetComponent(BeeControllerScript).m_LookEnabled = false;
		GetComponent(BeeScript).m_DrawGUI = false;
		m_Camera.GetComponent(MotionBlur).enabled = true;
		m_Camera.animation["CameraLessDramaticZoom"].speed = 1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	
	
	
	}


}

function Update () {
	
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	if(m_Lifetime > 0.0)
	{
		if(NetworkUtils.IsLocalGameObject(gameObject))
			m_Camera.GetComponent(MotionBlur).enabled = true;
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0.0)
		{		
			
			GetComponent(BeeScript).Show(true);
			AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_RespawnSound, Camera.main.transform.position);
			if(NetworkUtils.IsLocalGameObject(gameObject))
			{				
				m_Camera.GetComponent(MotionBlur).enabled = false;
				m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
				m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
				m_Camera.animation.Play("CameraLessDramaticZoom");
			}
		}
	}
	
	if(m_Lifetime <= 0)
	{
		//find respawn position;
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{
			transform.rotation = Quaternion.identity;
			m_Camera.GetComponent(CameraScript).m_CamPos = transform.position;
			m_Camera.GetComponent(CameraScript).SnapToOffset();
		}
		gameObject.GetComponent(BeeScript).enabled = false;
		m_AnimTime -= Time.deltaTime;
		transform.position = Vector3(m_RespawnPos.x, Mathf.Lerp(m_RespawnPos.y, 7, Mathf.Max(1-m_AnimTime/0.25, 0)), m_RespawnPos.z);
		GetComponent(TrailRenderer).enabled = true;
		
		if(m_AnimTime <= 0)
		{
			if(Network.isServer)
			{
				networkView.RPC("RemoveComponent", RPCMode.All, "RespawnDecorator");
			}
		}
		
	}
}

function OnGUI()
{
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		var camWidth = m_Camera.camera.rect.width;
		var camScale = m_Camera.camera.rect.width;
		var camPos:Vector2 = Vector2(m_Camera.camera.rect.x*Screen.width,Mathf.Abs(m_Camera.camera.rect.y - 0.5)*Screen.height);
		if(m_Camera.camera.rect.y == 0.0 &&  m_Camera.camera.rect.height == 1)
			camPos.y = 0;
		var time:int = (m_Lifetime+0.5);
		var style:GUIStyle = GetComponent(BeeScript).FontStyle;
		var tempMinItemWidth:float;
		var tempMaxItemWidth:float;
		style.CalcMinMaxWidth(GUIContent("Respawning in  "), tempMinItemWidth, tempMaxItemWidth);
		GUI.backgroundColor.a = 0;
		GUI.Label(Rect(camPos.x+camScale*Screen.width*0.5 - tempMinItemWidth*0.5,camPos.y,256,512), "Respawning in "+time, style);
		
	}
}

function SetLifetime(time : float)
{
	m_Lifetime = time;
}

function OnDestroy()
{
	if(!gameObject.active)
		return;
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		GetComponent(BeeControllerScript).m_LookEnabled = true;
		GetComponent(BeeScript).m_DrawGUI = true;
		
		m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
		m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	}
	
	GetComponent(BeeScript).m_HP = GetComponent(BeeScript).GetMaxHP();
	GetComponent(CharacterController).enabled = true;
	GetComponent(SphereCollider).enabled = true;
	gameObject.transform.localScale = Vector3(2,2,2);
	//gameObject.animation.Play("SpawnPlayer");
	GetComponent(BeeScript).Show(true);
	Destroy(GetComponent(ControlDisablerDecorator));
	GetComponent(BeeScript).enabled = true;
	GetComponent(TrailRenderer).enabled = false;
	GetComponentInChildren(ParticleRenderer).enabled = true;
	GetComponent(BeeControllerScript).Reload();
	GetComponent(BeeControllerScript).QuickReload();
}