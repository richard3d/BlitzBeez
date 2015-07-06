#pragma strict
var m_GUISkin:GUISkin = null;
private var m_Life:float = -1;
private var m_Lifetime:float = 0.35;
private var m_Bee:GameObject = null;
public var m_CrownTexture:Texture2D;
public var m_MatchOverMusic:AudioClip = null;
public var m_MenuSound:AudioClip = null;
private var m_Players:GameObject[];
private var m_MenuPos:Vector2;
function Start () {
	m_Life = m_Lifetime;
	GetComponent(GUIScript).m_ImgColor = Color.black;
	Camera.main.transform.position = Vector3(0,0,0);
	Camera.main.transform.LookAt(Vector3(0,0,1));
	
	GameObject.Find("Music").GetComponent(AudioSource).clip = m_MatchOverMusic;
	GameObject.Find("Music").GetComponent(AudioSource).Play();
	
	m_MenuPos.x = -Screen.width;
	
	
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
			
			m_Players = GameObject.FindGameObjectsWithTag("Player");
			for(var player :GameObject in m_Players)
			{
				if(player == NetworkUtils.GetGameObjectFromClient(GameStateManager.m_WinningPlayer))
				{	
					Camera.main.fov = 60;
					m_Bee = GameObject.Instantiate(GameObject.Find(player.name+"/Bee"));
					m_Bee.animation.Stop();
					GameObject.Find(m_Bee.name+"/NewBee").animation.Stop();
					GameObject.Find(m_Bee.name+"/NewBee").animation.Play("celebrate");
					GameObject.Find(m_Bee.name+"/NewBee").animation["celebrate"].speed = 0.75;
					GameObject.Find(m_Bee.name+"/NewBee/NewBee").layer = LayerMask.NameToLayer("FullScreenGUI");
					if(GameObject.Find(m_Bee.name+"/NewBee/NewBee/head/swag") != null)
						GameObject.Find(m_Bee.name+"/NewBee/NewBee/head/swag").layer = LayerMask.NameToLayer("FullScreenGUI");
					m_Bee.layer = LayerMask.NameToLayer("FullScreenGUI");
					m_Bee.transform.position = Camera.main.transform.position + Camera.main.transform.forward *  15;
					m_Bee.transform.localScale= Vector3(0,0,0);
					m_Bee.transform.eulerAngles.x = 300;
					m_Bee.renderer.enabled = true;
					var parts:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/SunrayParticles"));
					parts.transform.position = m_Bee.transform.position+ Camera.main.transform.forward *  50;
					parts.transform.LookAt(Camera.main.transform.position);
					parts.layer = LayerMask.NameToLayer("FullScreenGUI");
					
					GetComponent(GUIScript).m_Rect.y = -2;
					GetComponent(GUIScript).m_Img = m_CrownTexture;
					GetComponent(GUIScript).m_ImgColor = Color.white;
					GetComponent(GUIScript).m_Color = Color.white;
					GetComponent(GUIScript).m_FontSize = 32;
					//GetComponent(GUIScript).enabled = true;
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
	var rect:Rect = new Rect(0,0,1,0.3);
	txt.GetComponent(GUIScript).m_Text =  str;
	txt.GetComponent(GUIScript).m_FontSize = 95;
	txt.GetComponent(GUIScript).m_Depth = -999999;
	txt.GetComponent(GUIScript).m_Rect = rect;
	txt.GetComponent(GUIScript).m_Color = Color.black;
	yield WaitForSeconds(0.1);
	txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  str;
	txt.GetComponent(GUIScript).m_FontSize = 95;
	txt.GetComponent(GUIScript).m_Depth = -999999;
	txt.GetComponent(GUIScript).m_Rect = rect;
	txt.GetComponent(GUIScript).m_Color = Color.black;
	yield WaitForSeconds(0.1);
	txt   = gameObject.Instantiate(Resources.Load("GameObjects/MatchStartGUI"));
	txt.GetComponent(GUIScript).m_Text =  str;
	txt.GetComponent(GUIScript).m_FontSize = 95;
	txt.GetComponent(GUIScript).m_Depth = -999999;
	txt.GetComponent(UpdateScript).m_Lifetime = -1;
	txt.GetComponent(GUIScript).m_Rect = rect;
	txt.GetComponent(GUIScript).m_Color = Color.black;
	yield WaitForSeconds(0.5);
	
	
	while(m_MenuPos.x != 0)
	{
		m_MenuPos.x = Mathf.Lerp(m_MenuPos.x,0,0.0166*20);
		if(Mathf.Abs(m_MenuPos.x) < 1)
			break;
		if(m_Bee != null)
		{
			m_Bee.transform.eulerAngles.y += 4;
		}
		yield WaitForSeconds(0.0166);
	}
	
	while(Input.GetAxis("Joy0 OK") == 0.0)
	{
		if(m_Bee != null)
		{
			m_Bee.transform.eulerAngles.y += 4;
		}
		yield WaitForSeconds(0.033);
	}
	AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);	
	
	var vel:float = Screen.width*0.5;
	var accel :float = Screen.width*40;

	while(Mathf.Abs(m_MenuPos.x) <  Screen.width)
	{
		vel += accel * 0.0166;
		m_MenuPos.x += vel*0.0166;
		yield WaitForSeconds(0.0166);
	}
	
	GetComponent(GUIScript).enabled = false;
	GameObject.Destroy(txt);
	while(m_Bee != null && m_Bee.transform.localEulerAngles.x > 0.01 && m_Bee.transform.localEulerAngles.y > 0.01)
	{
		m_Bee.transform.rotation = Quaternion.Slerp(m_Bee.transform.rotation, Quaternion.identity, 15/60.0);
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
	
		//m_GUISkin.label.fixedWidth = Screen.width/5.0;
	
		GUI.BeginGroup (Rect(m_MenuPos.x, Screen.height*.30, Screen.width,Screen.height*0.5), m_GUISkin.GetStyle("Background"));	
			GUI.backgroundColor.a = 0;
		//var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");	
		m_GUISkin.label.alignment = TextAnchor.UpperLeft;
		//m_GUISkin.label.fontSize = 48;
		
			var width = Screen.width/5.0;
			GUI.Label(Rect(0,0,width, m_GUISkin.label.fontSize)," ", m_GUISkin.label);
			GUI.Label(Rect(width,0,width, m_GUISkin.label.fontSize),"Score", m_GUISkin.label);
			GUI.Label(Rect(width*2,0,width, m_GUISkin.label.fontSize),"Kills", m_GUISkin.label);
			GUI.Label(Rect(width*3,0,width, m_GUISkin.label.fontSize),"Deaths", m_GUISkin.label);
			GUI.Label(Rect(width*4,0,width, m_GUISkin.label.fontSize),"Longest Chain", m_GUISkin.label);
		//GUILayout.EndHorizontal();
		
		//m_GUISkin.label.margin= new RectOffset(0,0,0,0);
		//m_GUISkin.label.fontSize = 24;
		GUI.backgroundColor = new Color(1,0.75,0,0.5);
		
		
		if(m_Players != null)
		{
			var players = new List.<GameObject>();
			for(var player:GameObject in m_Players)
			{
				players.Add(player);
			}
			players.Sort(GameStateManager.CompareWinners);
			
			for(var p:int = 0; p < players.Count; p++)
			{
				//GUILayout.BeginHorizontal();
				
				//GUILayout.Label(m_Players[p].name, m_GUISkin.label);
				//GUILayout.Label("1000", m_GUISkin.label);
				//GUILayout.Label("15", m_GUISkin.label);
				//GUILayout.Label("23", m_GUISkin.label);
				//GUILayout.Label("8", m_GUISkin.label);
				var y:float = (p+1) * m_GUISkin.label.fontSize*1.1;
				
				if(NetworkUtils.GetClientFromGameObject(players[p]) == GameStateManager.m_WinningPlayer)
				{
					GUI.Label(Rect(0,y,width, 32),"       "+NetworkUtils.GetClientObjectFromGameObject(players[p]).m_Name, m_GUISkin.label);
					var scale = Mathf.Sin(Time.time*8)*8;
					GUI.DrawTexture(Rect(4-scale*0.5,y-scale*0.5,32+scale, 32+scale),m_CrownTexture);
				}
				else
					GUI.Label(Rect(0,y,width, 32),"       "+NetworkUtils.GetClientObjectFromGameObject(players[p]).m_Name, m_GUISkin.label);
				GUI.Label(Rect(width,y,width, 32)," "+players[p].GetComponent(BeeScript).m_MatchPoints, m_GUISkin.label);
				GUI.Label(Rect(width*2,y,width, 32)," "+players[p].GetComponent(BeeScript).m_Kills, m_GUISkin.label);
				GUI.Label(Rect(width*3,y,width, 32)," "+players[p].GetComponent(BeeScript).m_Deaths, m_GUISkin.label);
				GUI.Label(Rect(width*4,y,width, 32)," "+players[p].GetComponent(BeeScript).m_LongestChain, m_GUISkin.label);
				//GUI.color = Color.white;
				//GUILayout.EndHorizontal();
			}
		}	
		
		m_GUISkin.label.alignment = TextAnchor.MiddleCenter;
		//m_GUISkin.label.fontSize = 32;
		GUI.EndGroup();
		GUI.backgroundColor = Color.white;
		//m_GUISkin.label.fixedWidth = 0;
		//m_GUISkin.label.margin.left = 4;	

}