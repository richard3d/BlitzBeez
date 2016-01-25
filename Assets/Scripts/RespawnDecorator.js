#pragma strict
private var m_Lifetime : float = 0.0;

var m_RespawnPos = Vector3(0,350,0);

private var m_HeavenlyRays : GameObject = null;
private var m_Halo : GameObject = null;
private var m_Camera:GameObject = null;
private var m_OldMask:int = 0;


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
		GetComponent(BeeScript).SetGUIEnabled(false);
	//	m_Camera.GetComponent(MotionBlur).enabled = true;
	//	m_Camera.animation["CameraLessDramaticZoom"].speed = 1;
	//	m_Camera.animation.Play("CameraLessDramaticZoom");
	}
	
	
	yield CountDown();

}

function CountDown()
{
	var delta:float = 0.033;
	while(m_Lifetime > 0.0)
	{
		if(NetworkUtils.IsLocalGameObject(gameObject))
			m_Camera.GetComponent(MotionBlur).enabled = true;
		m_Lifetime -= delta;
		yield WaitForSeconds(delta);
		
	}
	
	var guiLayer:String = "GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1);
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_OldMask = m_Camera.camera.cullingMask;
		m_Camera.camera.cullingMask = 1 << LayerMask.NameToLayer(guiLayer);
		m_Camera.camera.clearFlags =  CameraClearFlags.SolidColor;
		m_Camera.camera.backgroundColor = Color32(49, 140, 219, 255);
		m_Camera.GetComponent(CameraScript).m_CollisionEnabled = false;
		m_Camera.GetComponent(MotionBlur).enabled = false;
		// m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
		// m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
		// m_Camera.animation.Play("CameraLessDramaticZoom");
		transform.Find("Swarm"+gameObject.name).gameObject.layer = LayerMask.NameToLayer(guiLayer);
		m_HeavenlyRays = GameObject.Instantiate(Resources.Load("GameObjects/HeavenlyRaysParticles"));	
		m_HeavenlyRays.transform.position = transform.position - Vector3.up*30 - transform.forward * 10;
		m_HeavenlyRays.transform.parent = transform;
		m_HeavenlyRays.transform.localEulerAngles = Vector3(270,0,0);
		m_HeavenlyRays.layer = LayerMask.NameToLayer(guiLayer);
		
		m_Halo = GameObject.Instantiate(Resources.Load("GameObjects/AngelHalo"));	
		m_Halo.transform.parent = transform.Find("Bee");
		m_Halo.transform.localPosition = Vector3(0,3.5,0);
		m_Halo.transform.localEulerAngles = Vector3(-8,0,0);
		m_Halo.transform.localScale = Vector3(2.5,0.8,2.5);
		m_Halo.layer = LayerMask.NameToLayer(guiLayer);
		
		
		
		
	}
	
	//show the bee		
	GetComponent(BeeScript).Show(true);
	GetComponent(BeeScript).SetLayerRecursive(transform.Find("Bee"),LayerMask.NameToLayer(guiLayer));

	
	
	var beeScript = GetComponent(BeeScript);
	//if( beeScript.m_NumUpgradesAvailable >= 0)
	//{
		//handle upgrade
		var six:int[] = new int[6];
		var removedTalents:Array = new Array();
		var validIndices:Array = new Array();
		for(var i:int = 0; i < GetComponent(TalentTree).m_Talents.Count; i++)
		{
			validIndices.Add(i);
		}
		for(i = 0; i < 6; i++)
		{
			var indexSel:int = Random.Range(0,validIndices.Count-1);
			six[i] = validIndices[indexSel];
			validIndices.RemoveAt(indexSel);
		}
		
		
		networkView.RPC("EnterHive", RPCMode.All, six[0], six[1], six[2], six[3], six[4], six[5]);
	//}
}

function RespawnPlayer()
{
		//find respawn position;
		var m_AnimTime : float = 0.25;
		var delta :float = 0.033;
		transform.position = Vector3(m_RespawnPos.x, Mathf.Lerp(m_RespawnPos.y, GetComponent(CharacterController).height, Mathf.Max(1-m_AnimTime/0.25, 0)), m_RespawnPos.z);
		var lookPos:Vector3;
		if(GetComponent(BeeScript).m_Team == 0)
			lookPos = GameStateManager.m_Hive2.transform.position;
		else
			lookPos = GameStateManager.m_Hive1.transform.position;
		lookPos.y = 0;
		transform.LookAt(lookPos);
	//	transform.rotation = Quaternion.identity;
		
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{
			
			m_Camera.GetComponent(CameraScript).m_CamPos = transform.position;
			m_Camera.GetComponent(CameraScript).m_DefaultOffset = Vector3(0,20,-60);
			m_Camera.GetComponent(CameraScript).Snap();
			
			m_Camera.camera.cullingMask = m_OldMask;
			m_Camera.camera.clearFlags = CameraClearFlags.Skybox;
			m_Camera.GetComponent(CameraScript).m_CollisionEnabled = true;
			
			// m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
			// m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
			// m_Camera.animation.Play("CameraLessDramaticZoom");
			var guiLayer:String = "GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1);
			transform.Find("Swarm"+gameObject.name).gameObject.layer = LayerMask.NameToLayer(guiLayer);
			Destroy(m_HeavenlyRays);
			Destroy(m_Halo);
			
			GetComponent(BeeScript).SetLayerRecursive(transform.Find("Bee"),LayerMask.NameToLayer("Players"));
			AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_RespawnSound, Camera.main.transform.position);
		}
		gameObject.GetComponent(BeeScript).enabled = false;
		
		while(m_AnimTime > 0)
		{
			m_AnimTime -= delta;
			transform.position = Vector3(m_RespawnPos.x, Mathf.Lerp(m_RespawnPos.y, GetComponent(CharacterController).height, Mathf.Max(1-m_AnimTime/0.25, 0)), m_RespawnPos.z);
			GetComponent(TrailRenderer).enabled = true;
			yield WaitForSeconds(delta);
		}
		
		yield WaitForSeconds(0.5);
		if(Network.isServer)
		{
			networkView.RPC("RemoveComponent", RPCMode.All, "RespawnDecorator");
		}
}

function Update () {
	
	 GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	 GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	// if(m_Lifetime > 0.0)
	// {
		// if(NetworkUtils.IsLocalGameObject(gameObject))
			// m_Camera.GetComponent(MotionBlur).enabled = true;
		// m_Lifetime -= Time.deltaTime;
		// if(m_Lifetime <= 0.0)
		// {		
			
			// GetComponent(BeeScript).Show(true);
			// AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_RespawnSound, Camera.main.transform.position);
			// if(NetworkUtils.IsLocalGameObject(gameObject))
			// {				
				// m_Camera.GetComponent(MotionBlur).enabled = false;
				// m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
				// m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
				// m_Camera.animation.Play("CameraLessDramaticZoom");
			// }
		// }
	// }
	
	// if(m_Lifetime <= 0)
	// {
		// //find respawn position;
		// if(NetworkUtils.IsLocalGameObject(gameObject))
		// {
			// transform.rotation = Quaternion.identity;
			// m_Camera.GetComponent(CameraScript).m_CamPos = transform.position;
			// m_Camera.GetComponent(CameraScript).SnapToOffset();
		// }
		// gameObject.GetComponent(BeeScript).enabled = false;
		// m_AnimTime -= Time.deltaTime;
		// transform.position = Vector3(m_RespawnPos.x, Mathf.Lerp(m_RespawnPos.y, GetComponent(CharacterController).height, Mathf.Max(1-m_AnimTime/0.25, 0)), m_RespawnPos.z);
		// GetComponent(TrailRenderer).enabled = true;
		
		// if(m_AnimTime <= 0)
		// {
			// if(Network.isServer)
			// {
				// networkView.RPC("RemoveComponent", RPCMode.All, "RespawnDecorator");
			// }
		// }
		
	// }
}

function OnGUI()
{
	if(NetworkUtils.IsLocalGameObject(gameObject) && m_Lifetime > 0)
	{
		var camWidth = m_Camera.camera.rect.width;
		var camScale = m_Camera.camera.rect.width;
		var camPos:Vector2 = Vector2(m_Camera.camera.rect.x*Screen.width,Mathf.Abs(m_Camera.camera.rect.y - 0.5)*Screen.height);
		if(m_Camera.camera.rect.y == 0.0 &&  m_Camera.camera.rect.height == 1)
			camPos.y = 0;
		var time:int = (m_Lifetime+0.5);
		var style:GUIStyle = GetComponent(BeeScript).FontStyle;
		var tempRect:Rect = GUILayoutUtility.GetRect(new GUIContent("Respawning in 10"), style);
		GUI.backgroundColor.a = 0;
		GUI.Label(Rect(camPos.x+camScale*Screen.width*0.5 - tempRect.width*0.5,camPos.y+tempRect.height*4,tempRect.width,tempRect.height), "Respawning in "+time, style);
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
		GetComponent(BeeScript).SetGUIEnabled(true);
		
		
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
	GetComponent(BeeControllerScript).m_Heading = transform.eulerAngles.y;
}