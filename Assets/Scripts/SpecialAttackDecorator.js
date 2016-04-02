#pragma strict
private var m_Lifetime: float = 1.5;
private var m_LightEffect:GameObject = null;
private var m_LightSpot:GameObject = null;
private var m_PlayerCam:GameObject = null;
private var m_OrigCamOffset : Vector3;
private var m_Imposter : GameObject; //the imposter for the player's bee
private var m_AttackEffect : GameObject = null;
private var m_BGEffect : GameObject; //Background effect for anime lines
private var m_OldMask : int;
function Start () {

	if(GetComponent(FlasherDecorator))
		Destroy(GetComponent(FlasherDecorator));
	

	AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_LevelUpSound, Camera.main.transform.position);
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;
		m_PlayerCam.GetComponent(CameraScript).Shake(1.5,0.35);
		m_PlayerCam.GetComponent(CameraScript).m_CollisionEnabled = false;
		GetComponent(BeeScript).SetGUIEnabled(false);
	}
	
	 
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
	GetComponent(UpdateScript).enabled = false;
	 
	GameObject.Find(gameObject.name+"/Bee/NewBee").GetComponent.<Animation>().Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").GetComponent.<Animation>().Play("levelup");
	GameObject.Find(gameObject.name+"/Bee/NewBee").transform.localEulerAngles.x = -90;
	transform.GetChild(0).localEulerAngles.z = 0;
	 
	
	m_LightEffect = GameObject.Instantiate(Resources.Load("GameObjects/CircularLightBeam"), transform.position, Quaternion.identity);
	m_LightEffect.GetComponent.<Animation>().Play();
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

	var guiLayer:String = "GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1);
	yield WaitForSeconds(lifetime);
	if(GetComponent(FlowerPowerDecorator))
		Destroy(GetComponent(FlowerPowerDecorator));

	//make invincible 
	gameObject.AddComponent(InvincibilityDecorator);
	GetComponent( InvincibilityDecorator ).m_Blink = false;
	GetComponent( InvincibilityDecorator ).SetLifetime(999);
	
	//spawn the attack effect
	AudioSource.PlayClipAtPoint(GetComponent(BeeScript).m_ShingSound, Camera.main.transform.position);
	m_AttackEffect = GameObject.Instantiate(Resources.Load("GameObjects/BeeSwarmAttackParticles"));	
	m_AttackEffect.GetComponent(ParticleSystem).startColor =  NetworkUtils.GetColor(gameObject);
	m_AttackEffect.transform.position = transform.position - transform.forward * 100;
	m_AttackEffect.transform.LookAt(transform.position);	
	m_AttackEffect.layer =  LayerMask.NameToLayer(guiLayer);
	m_AttackEffect.transform.GetChild(0).gameObject.layer =  LayerMask.NameToLayer(guiLayer);
	
	//do camera effects and other local coolness
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		GetComponent(BeeScript).SetGUIEnabled(false);
	
		m_PlayerCam = gameObject.GetComponent(BeeScript).m_Camera;	
		m_PlayerCam.GetComponent(CameraScript).Shake(5,0.35);
		m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset = Vector3(5,10,48);
		m_OldMask = m_PlayerCam.GetComponent.<Camera>().cullingMask;
		m_PlayerCam.GetComponent.<Camera>().cullingMask = 1 << LayerMask.NameToLayer(guiLayer);
		m_PlayerCam.GetComponent.<Camera>().clearFlags =  CameraClearFlags.SolidColor;
		m_PlayerCam.GetComponent.<Camera>().backgroundColor = Color(0.88,0.88,0.88);
	//	m_PlayerCam.camera.backgroundColor = Color(0.611,0.725,0.760);
		
		m_BGEffect = GameObject.Instantiate(Resources.Load("GameObjects/AnimeLinesParticles"));
		m_BGEffect.transform.position = transform.position;
		m_BGEffect.layer = LayerMask.NameToLayer(guiLayer);
		
		var inst:GameObject = GameObject.Find(gameObject.name+"/Bee/NewBee") ;
		var go:GameObject = GameObject.Instantiate( inst, inst.transform.position, inst.transform.rotation );
		// go.animation.Stop();
		// go.animation.Play("levelup");
		
		go.transform.localEulerAngles.x = -90;
		go.layer = LayerMask.NameToLayer(guiLayer);
		go.transform.Find("NewBee").gameObject.layer = LayerMask.NameToLayer(guiLayer);
		go.transform.Find("BeeArmor").gameObject.layer = LayerMask.NameToLayer(guiLayer);
		if(go.transform.Find("body/head/swag") != null)
			go.transform.Find("body/head/swag").gameObject.layer = LayerMask.NameToLayer(guiLayer);
		
		m_Imposter = new GameObject();
		m_Imposter.transform.position = inst.transform.position;
		m_Imposter.transform.rotation = inst.transform.rotation;
		go.transform.parent = m_Imposter.transform;
		//go.transform.position = parent.position;
		m_Imposter.transform.localScale = Vector3(3,3,3);
		m_Imposter.transform.localEulerAngles.x = 0;
		
	
		//go.transform.GetChild(0).localEulerAngles.z = 0;
		
	}
	GameObject.Find(gameObject.name+"/Bee/NewBee").GetComponent.<Animation>().Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").GetComponent.<Animation>().Play("fly");
	GameObject.Find(gameObject.name+"/Bee/NewBee").transform.localEulerAngles.x = 0;
	
	yield WaitForSeconds(3);
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_PlayerCam.GetComponent(CameraScript).m_DefaultOffset = Vector3(0,20,-60);
		m_PlayerCam.GetComponent.<Camera>().cullingMask = m_OldMask;
		m_PlayerCam.GetComponent.<Camera>().clearFlags = CameraClearFlags.Skybox;
		Destroy(m_BGEffect);
		Destroy(m_Imposter);
		m_PlayerCam.GetComponent(CameraScript).m_CollisionEnabled = true;
		
	}
	
	
	//check for collisions with other players
	m_AttackEffect.GetComponent(SpecialAttackScript).m_TeamOwner = GetComponent(BeeScript).m_Team;
	m_AttackEffect.GetComponent(SpecialAttackScript).m_Owner = gameObject;
	m_AttackEffect.GetComponent(SpecialAttackScript).enabled = true;
	m_AttackEffect.GetComponent(SpecialAttackScript).m_Duration = 2;
	m_AttackEffect.layer = LayerMask.NameToLayer("Default");
	m_AttackEffect.transform.GetChild(0).gameObject.layer = LayerMask.NameToLayer("Default"); 
	
	yield WaitForSeconds(m_AttackEffect.GetComponent(SpecialAttackScript).m_Duration+0.5);
	GetComponent(BeeScript).SetGUIEnabled(true);
	
	Destroy(m_AttackEffect);
	if(Network.isServer)
				ServerRPC.Buffer(GetComponent.<NetworkView>(), "RemoveComponent",RPCMode.All, "SpecialAttackDecorator");
}



function Update () {

}

function OnDestroy()
{
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		
	}
	
	if(GetComponent( InvincibilityDecorator ) != null)
		Destroy(GetComponent( InvincibilityDecorator ));
	
	if(m_AttackEffect != null)
	{
		Destroy(m_AttackEffect);
	}
	//

	
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	GetComponent(BeeControllerScript).m_LookEnabled = true;
	//Destroy(GetComponent(PauseDecorator));
	GetComponent(UpdateScript).enabled = true;
	Destroy(m_LightEffect);
	Destroy(m_LightSpot);
}