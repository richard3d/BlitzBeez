#pragma strict
private var m_Lifetime: float = 1.5;
private var m_LightEffect:GameObject = null;
private var m_LightSpot:GameObject = null;
private var m_PlayerCam:GameObject = null;
private var m_OrigCamOffset : Vector3;
private var m_Imposter : GameObject; //the imposter for the player's bee
private var m_BGEffect : GameObject; //Background effect for anime lines
private var m_OldMask : int;
function Start () {

	AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_LevelUpSound, Camera.main.transform.position);
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;
		m_PlayerCam.GetComponent(CameraScript).Shake(1.5,0.35);
		m_PlayerCam.GetComponent(CameraScript).m_CollisionEnabled = false;
		GetComponent(BeeScript).SetGUIEnabled(false);
	}
	gameObject.AddComponent(InvincibilityDecorator);
	GetComponent( InvincibilityDecorator ).m_Blink = false;
	GetComponent( InvincibilityDecorator ).SetLifetime(m_Lifetime);
	 
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
	GetComponent(UpdateScript).enabled = false;
	 
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Play("levelup");
	GameObject.Find(gameObject.name+"/Bee/NewBee").transform.localEulerAngles.x = -90;
	transform.GetChild(0).localEulerAngles.z = 0;
	 
	
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
	
	//This does all the pizazz
	DoPowerup(1.5);
}

function DoPowerup(lifetime : float)
{

	
	yield WaitForSeconds(lifetime);
	AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_ShingSound, Camera.main.transform.position);
	var bees:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/BeeSwarmAttackParticles"));	
	bees.GetComponent(ParticleSystem).startColor =  NetworkUtils.GetColor(gameObject);
	bees.transform.position = transform.position - transform.forward * 100;
	bees.transform.LookAt(transform.position);	
	bees.layer =  LayerMask.NameToLayer("GUILayer_P1");
	bees.transform.GetChild(0).gameObject.layer =  LayerMask.NameToLayer("GUILayer_P1");
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		GetComponent(BeeScript).SetGUIEnabled(false);
	
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;	
		m_PlayerCam.GetComponent(CameraScript).Shake(5,0.35);
		m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset = Vector3(5,10,48);
		m_OldMask = m_PlayerCam.camera.cullingMask;
		m_PlayerCam.camera.cullingMask = 1 << 15;
		m_PlayerCam.camera.clearFlags =  CameraClearFlags.SolidColor;
		m_PlayerCam.camera.backgroundColor = Color(0.88,0.88,0.88);
	//	m_PlayerCam.camera.backgroundColor = Color(0.611,0.725,0.760);
		
		m_BGEffect = GameObject.Instantiate(Resources.Load("GameObjects/AnimeLinesParticles"));
		m_BGEffect.transform.position = transform.position;
		m_BGEffect.layer = LayerMask.NameToLayer("GUILayer_P1");
		
		var inst:GameObject = GameObject.Find(gameObject.name+"/Bee/NewBee") ;
		var go:GameObject = GameObject.Instantiate( inst, inst.transform.position, inst.transform.rotation );
		// go.animation.Stop();
		// go.animation.Play("levelup");
		
		go.transform.localEulerAngles.x = -90;
		go.layer = LayerMask.NameToLayer("GUILayer_P1");
		go.transform.Find("NewBee").gameObject.layer = LayerMask.NameToLayer("GUILayer_P1");
		go.transform.Find("BeeArmor").gameObject.layer = LayerMask.NameToLayer("GUILayer_P1");
		if(go.transform.Find("body/head/swag") != null)
			go.transform.Find("body/head/swag").gameObject.layer = LayerMask.NameToLayer("GUILayer_P1");
		
		m_Imposter = new GameObject();
		m_Imposter.transform.position = inst.transform.position;
		m_Imposter.transform.rotation = inst.transform.rotation;
		go.transform.parent = m_Imposter.transform;
		//go.transform.position = parent.position;
		m_Imposter.transform.localScale = Vector3(3,3,3);
		m_Imposter.transform.localEulerAngles.x = 0;
		
	
		//go.transform.GetChild(0).localEulerAngles.z = 0;
		
	}
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Play("fly");
	GameObject.Find(gameObject.name+"/Bee/NewBee").transform.localEulerAngles.x = 0;
	
	yield WaitForSeconds(3);
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset = Vector3(0,20,-60);
		m_PlayerCam.camera.cullingMask = m_OldMask;
		m_PlayerCam.camera.clearFlags = CameraClearFlags.Skybox;
		Destroy(m_BGEffect);
		Destroy(m_Imposter);
		m_PlayerCam.GetComponent(CameraScript).m_CollisionEnabled = true;
		
	}
	
	
	//check for collisions with other players
		
	bees.GetComponent(SpecialAttackScript).m_TeamOwner = GetComponent(BeeScript).m_Team;
	bees.GetComponent(SpecialAttackScript).m_Owner = gameObject;
	bees.GetComponent(SpecialAttackScript).enabled = true;
	bees.GetComponent(SpecialAttackScript).m_Duration = 2;
	bees.layer = LayerMask.NameToLayer("Default");
	bees.transform.GetChild(0).gameObject.layer = LayerMask.NameToLayer("Default"); 
	//	Debug.Log("INTERSEC");
	
	yield WaitForSeconds(bees.GetComponent(SpecialAttackScript).m_Duration+0.5);
	GetComponent(BeeScript).SetGUIEnabled(true);
	
	Destroy(bees);
	if(Network.isServer)
				ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "FlowerPowerDecorator");
}



function Update () {
	//GetComponent(BeeScript).SetColor(GetComponent(BeeScript).m_Color);
	// if(m_Lifetime > 0)
	// {
		// m_Lifetime -= Time.deltaTime;
	// //	m_LightEffect.transform.localScale = Vector3(12*m_Lifetime,300,12*m_Lifetime);
		// if(m_Lifetime <= 0)
		// {
			// // if(Network.isServer)
				// // ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "FlowerPowerDecorator");
		// }
	// }

}

function OnDestroy()
{
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		
	}
	
	//

	
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	GetComponent(BeeControllerScript).m_LookEnabled = true;
	//Destroy(GetComponent(PauseDecorator));
	GetComponent(UpdateScript).enabled = true;
	Destroy(m_LightEffect);
	Destroy(m_LightSpot);
}