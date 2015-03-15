#pragma strict

private var m_Life:float = -1;
private var m_Lifetime:float = 0.35;
private var m_Bee:GameObject = null;
public var m_CrownTexture:Texture2D;
function Start () {
	m_Life = m_Lifetime;
	GetComponent(GUIScript).m_ImgColor = Color.black;
	Camera.main.transform.position = Vector3(0,0,0);
	Camera.main.transform.LookAt(Vector3(0,0,1));
	
}

function Update () {

	if(m_Life > 0)
	{
		m_Life -= Time.deltaTime;
		GetComponent(GUIScript).m_Rect.width =  1-(m_Life/m_Lifetime);
		
		if(m_Life  <= 0)
		{
			ShowWinnerText();
			Camera.main.depth = 99;
			GetComponent(GUIScript).m_Rect = new Rect(0,0,1,0);
			GetComponent(GUIScript).enabled = false;
			var cams:GameObject[] = GameObject.FindGameObjectsWithTag("PlayerCamera");
			for(var cam :GameObject in cams)
			{
				cam.active = false;
			}
			
			var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
			for(var player :GameObject in players)
			{
				if(player == NetworkUtils.GetGameObjectFromClient(GameStateManager.m_WinningPlayer))
				{	
					Camera.main.fov = 60;
					m_Bee = GameObject.Instantiate(GameObject.Find(player.name+"/Bee"));
					m_Bee.animation.Stop();
					m_Bee.layer = LayerMask.NameToLayer("FullScreenGUI");
					m_Bee.transform.position = Camera.main.transform.position + Camera.main.transform.forward *  10;
					m_Bee.transform.localScale= Vector3(0,0,0);
					m_Bee.transform.eulerAngles.x = 300;
					
					var parts:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/SunrayParticles"));
					parts.transform.position = m_Bee.transform.position+ Camera.main.transform.forward *  50;
					parts.transform.LookAt(Camera.main.transform.position);
					parts.layer = LayerMask.NameToLayer("FullScreenGUI");
					
					GetComponent(GUIScript).m_Rect.y = -2;
					GetComponent(GUIScript).m_Img = m_CrownTexture;
					GetComponent(GUIScript).m_ImgColor = Color.white;
					GetComponent(GUIScript).m_Color = Color.white;
					GetComponent(GUIScript).m_FontSize = 32;
					GetComponent(GUIScript).enabled = true;
				}
				player.active = false;
			}
		}	
	}	
	
	if(m_Bee != null)
	{
		//StopCoroutine("ShowWinnerText");
		var scale:float = m_Bee.transform.localScale.x;
		scale = Mathf.Lerp(scale, 1.5, Time.deltaTime*5);
		if(1.5 - scale > 0.1)
			m_Bee.transform.localScale = Vector3(scale, scale, scale);
		
		
		GetComponent(GUIScript).m_Rect = Rect(0.4,Mathf.Lerp(GetComponent(GUIScript).m_Rect.y, 0, Time.deltaTime *10),0.2,0.2);
		
		
		var speed = 8;
		var val:float = (Mathf.Sin(Time.time*speed) + 1)*0.5 * 25;
		var rVal:float = 183+val;
		var gVal:float = 145+val;
		var bVal:float = 41+val;
		
		var shade:float = 1/255.0;//(Mathf.Sin(Time.time*speed) + 1)*0.5+0.5;
		Camera.main.backgroundColor = Color(rVal*shade,gVal*shade,bVal*shade,1);
	
		
	}
	
}

function ShowWinnerText()
{
	var str:String = "Player "+(GameStateManager.m_WinningPlayer+1)+" Wins!";
	var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  str;
	txt.GetComponent(GUIScript).m_FontSize = 64;
	txt.GetComponent(GUIScript).m_Depth = -999999;
	txt.GetComponent(GUIScript).m_Rect = Rect(0,0.5,1,0.5);
	txt.GetComponent(GUIScript).m_Color = Color.black;
	yield WaitForSeconds(0.1);
	txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  str;
	txt.GetComponent(GUIScript).m_FontSize = 64;
	txt.GetComponent(GUIScript).m_Depth = -999999;
	txt.GetComponent(GUIScript).m_Rect = Rect(0,0.5,1,0.5);
	txt.GetComponent(GUIScript).m_Color = Color.black;
	yield WaitForSeconds(0.1);
	txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  str;
	txt.GetComponent(GUIScript).m_FontSize = 64;
	txt.GetComponent(GUIScript).m_Depth = -999999;
	txt.GetComponent(UpdateScript).m_Lifetime = 10;
	txt.GetComponent(GUIScript).m_Rect = Rect(0,0.5,1,0.5);
	txt.GetComponent(GUIScript).m_Color = Color.black;
	yield WaitForSeconds(10);
	
	
	GetComponent(GUIScript).enabled = false;
	while(m_Bee != null && m_Bee.transform.rotation.x > 0.01)
	{
		m_Bee.transform.rotation = Quaternion.Slerp(m_Bee.transform.rotation, Quaternion.identity, Time.deltaTime*50);
		yield WaitForSeconds(1/60.0);
	}
	
	while(Camera.main.fov < 175)
	{
		Camera.main.fov += Time.deltaTime * 1200;
		yield WaitForSeconds(1/60.0);
	}
	
	m_Bee.active = false;
	
	while(Camera.main.GetComponent(GlobalFog).globalDensity < 0.01)
	{
		Camera.main.GetComponent(GlobalFog).globalDensity += .0001;
		yield WaitForSeconds(1/60.0);
	}
	
	
	if(Network.isServer)
	{
		GameObject.Find("GameServer").GetComponent(ServerScript).InitiateMatchShutdown();
	}
}

function OnGUI()
{
	

}