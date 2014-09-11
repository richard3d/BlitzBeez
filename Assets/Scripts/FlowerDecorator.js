#pragma strict

private var m_Lifetime : float = 2.5;
private var m_LifeTimer : float = 0;
private var m_Flower : GameObject = null;
private var m_BeeAdditionTimer : float = 0.1;
private var m_FirstInput : boolean = true;
private var m_SwarmCreated : boolean = false;
private var m_SpeedAddBees : boolean = false;
private var m_ShieldEffect : GameObject = null;
private var m_PollenParticles : GameObject = null;

function Start () {

	

	GetComponent(BeeControllerScript).m_MoveEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
	GetComponent(BeeControllerScript).m_AttackEnabled = false;
	
	var trgt : Transform = transform.Find("PowerShotParticleSystem(Clone)");
	if(trgt != null)
		Destroy(trgt.gameObject);
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		m_Flower.audio.Play();
		Camera.main.animation["CameraLessDramaticZoom"].speed = 1;
		Camera.main.animation.Play("CameraLessDramaticZoom");
	}
	
}

function OnNetworkInput(IN : InputState)
{
	
	if(!networkView.isMine)
	{
		return;
	}
	
	if(m_FirstInput)
	{
		 m_FirstInput = false;
		return;
	}
	
	if(m_Flower == null)
		return;
		
	
	
	if(!IN.GetAction(IN.USE))
	{
		ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
		
	}
	
	
}

function Update () {


	

	if(!m_Flower)
		return;
	
	if(m_LifeTimer < m_Lifetime)	
		m_LifeTimer += Time.deltaTime;
	else
	{
		var Comp : BeeParticleScript = GetComponentInChildren(BeeParticleScript) as BeeParticleScript;
		if(Comp == null)
		
			return;
		
		if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
		{
			var offset : Vector3 = Vector3(0,12,0);
			m_SwarmCreated = true;
			if(Network.isServer)
			{
				m_Flower.GetComponent(FlowerScript).m_PollinationTimer = m_Flower.GetComponent(FlowerScript).m_PollinationTime;
				ServerRPC.Buffer(networkView,"AddSwarm", RPCMode.All, m_Flower.name, offset, 10);
				ServerRPC.Buffer(networkView,"RemoveComponent", RPCMode.All, "FlowerDecorator");
				return;
			}
		
				
		}
		
		
	}
	
	//m_BeeAdditionTimer -= Time.deltaTime;	
		
	//m_Flower.GetComponent(FlowerScript).m_LifebarTimer = 0.01;
	transform.position +=   (m_Flower.transform.position + Vector3(0,12,0) - transform.position) * Time.deltaTime * 20;
	transform.position. y = m_Flower.transform.position.y + 12;
	if(!GetComponent(BeeControllerScript).m_LookEnabled)
		transform.eulerAngles = Vector3(0,0,0);
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
		{
			var txt : GameObject = gameObject.Find("SwarmCountText");
			txt.transform.position = Camera.main.WorldToViewportPoint(transform.position + Vector3.up * transform.localScale.z*5);
			txt.transform.position.y += 0.04;
			txt.GetComponent(GUIText).enabled = true;
			txt.GetComponent(GUIText).text = "Capturing";
		}
	}

}


function OnGUI()
{
	if(m_Flower == null)
		return;
	
	if((Network.isServer && gameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == gameObject) ||
			Network.isClient && gameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == gameObject)
	{
		var width : float = 100;
		var perc : float =   Mathf.Min(m_LifeTimer/m_Lifetime,1) * width;	
		var pos : Vector3 = Camera.main.WorldToScreenPoint(transform.position + Vector3.up * transform.localScale.z*6);
		//GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y, width, 10), m_Flower.GetComponent(FlowerScript).BaseTexture);
	//	GUI.DrawTexture(Rect(pos.x- width* 0.5,Screen.height-pos.y,perc,10), m_Flower.GetComponent(FlowerScript).LifeTexture);
		
		width  = 32;
		// GUIUtility.RotateAroundPivot ((m_LifeTimer/m_Lifetime)*1*359,  Vector2(pos.x, Screen.height-pos.y)); 
		// GUI.DrawTexture(Rect(pos.x - 64* 0.5,Screen.height-pos.y - 64/2, 64, 64), m_Flower.GetComponent(FlowerScript).BaseTexture);
		// GUIUtility.RotateAroundPivot (-(m_LifeTimer/m_Lifetime)*1*359,  Vector2(pos.x, Screen.height-pos.y)); 
		GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y - width/2, width, width), m_Flower.GetComponent(FlowerScript).ClockTexture);
		GUIUtility.RotateAroundPivot (Mathf.Min(m_LifeTimer/m_Lifetime,1)*359,  Vector2(pos.x, Screen.height-pos.y)); 
		GUI.DrawTexture(Rect(pos.x - width* 0.5,Screen.height-pos.y- width/2, width, width), m_Flower.GetComponent(FlowerScript).ClockHandTexture);
	}
}


function OnDestroy()
{
	m_Flower.audio.Stop();
	if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
	{
		
		gameObject.Destroy(m_ShieldEffect);
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			Camera.main.animation["CameraLessDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
			Camera.main.animation["CameraLessDramaticZoom"].speed = -1;
			Camera.main.animation.Play("CameraLessDramaticZoom");
		}
		
		if(Network.isServer)
			ServerRPC.DeleteFromBuffer(m_Flower);
		
	}
	else
	{
		m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/Shield"));
		m_ShieldEffect.name = "Shield";
		m_ShieldEffect.transform.position = m_Flower.transform.position;
		m_ShieldEffect.transform.parent = m_Flower.transform;
		m_ShieldEffect.GetComponent(ParticleSystem).renderer.material.SetColor("_EmisColor", renderer.material.color);
		m_ShieldEffect.GetComponent(ParticleSystem).startColor = gameObject.renderer.material.color;
		m_PollenParticles = gameObject.Instantiate(Resources.Load("GameObjects/PollenParticles"));
		m_PollenParticles.transform.position = m_Flower.transform.position;
		m_PollenParticles.name = "PollenParticles";
		m_PollenParticles.transform.parent = m_Flower.transform;
	
		
		m_Flower.animation.Play("Flower");
		
		
		
		
		AudioSource.PlayClipAtPoint(m_Flower.GetComponent(FlowerScript).m_BuildComplete, transform.position);
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			
			
			//AudioSource.PlayClipAtPoint(m_Flower.GetComponent(FlowerScript).m_StopwatchDing, transform.position);
			var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			txt.GetComponent(KudosTextScript).m_WorldPos = transform.position;
			txt.GetComponent(UpdateScript).m_Lifetime = 2;
			gameObject.GetComponent(BeeScript).m_Money +=  25;
			txt.GetComponent(GUIText).text = "+ $25";
			txt.GetComponent(GUIText).material.color = Color.yellow;
			Camera.main.GetComponent(CameraScript).Shake(0.25, 0.5);
			Camera.main.animation["CameraLessDramaticZoom"].time = Camera.main.animation["CameraDramaticZoom"].length;
			Camera.main.animation["CameraLessDramaticZoom"].speed = -1;
			Camera.main.animation.Play("CameraLessDramaticZoom");
		}
	}
	
	gameObject.Find("SwarmCountText").GetComponent(GUIText).enabled = false;
	GetComponent(BeeControllerScript).m_MoveEnabled = true;
	GetComponent(BeeControllerScript).m_LookEnabled = true;
	GetComponent(BeeControllerScript).m_AttackEnabled = true;
	GetComponent(BeeControllerScript).SetShootButtonTimeHeld(0);
	
	
	// var poof:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/PowerShotParticleSystem"));
	// poof.transform.position = transform.position ;
	
	//if(Network.isServer && m_SwarmCreated)
		//gameObject.networkView.RPC("AddXP", RPCMode.All, 999);
}

function SetFlower(flower : GameObject)
{
	m_Flower = flower;
	if(m_Flower.transform.Find("Shield") == null)
	{
		// m_ShieldEffect = GameObject.Instantiate(Resources.Load("GameObjects/Shield"));
		// m_ShieldEffect.name = "Shield";
		// m_ShieldEffect.transform.position = m_Flower.transform.position;
		// m_ShieldEffect.transform.parent = m_Flower.transform;
		
		// var parts : ParticleSystem.Particle[] = new ParticleSystem.Particle[m_ShieldEffect.GetComponent(ParticleSystem).particleCount];
		// var numParts : int = m_ShieldEffect.GetComponent(ParticleSystem).GetParticles(parts);
		// //Debug.Log("particle" + parts.length);
		// for(var i : int = 0; i < numParts; i++)
		// {
			// parts[i].color = gameObject.renderer.material.color;
		// }
		// m_ShieldEffect.GetComponent(ParticleSystem).SetParticles(parts, i);
		// m_ShieldEffect.GetComponent(ParticleSystem).startColor = gameObject.renderer.material.color;
	}
}

function GetFlower() : GameObject
{
	return m_Flower;
}

// @RPC function RemoveFlowerDecorator()
// {
	// if(m_Flower.transform.Find("Swarm"+m_Flower.name) == null)
	// {
		// gameObject.Destroy(m_ShieldEffect);
		// if(Network.isServer)
			// ServerRPC.DeleteFromBuffer(m_Flower);
	// }
	// else
	// {
		// Camera.main.GetComponent(CameraScript).Shake(0.5, 0.25);
	// }
	// Destroy(this);
// }