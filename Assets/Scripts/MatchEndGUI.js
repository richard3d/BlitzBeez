#pragma strict
var m_GUISkin:GUISkin = null;
private var m_Life:float = -1;
private var m_Lifetime:float = 0.35;
private var m_Bees:Array = new Array();
public var m_CrownTexture:Texture2D;
public var m_MatchOverMusic:AudioClip = null;
public var m_MenuSound:AudioClip = null;
private var m_Players:GameObject[];
private var m_MenuPos:Vector2;
private var m_FadePos:Vector2;
function Start () {
	m_Life = m_Lifetime;
	GetComponent(GUIScript).m_ImgColor = Color.black;
	Camera.main.transform.position = Vector3(0,0,0);
	Camera.main.transform.LookAt(Vector3(0,0,1));
	
	
	if(GameObject.Find("Music"))
	{
		GameObject.Find("Music").GetComponent(AudioSource).clip = m_MatchOverMusic;
		GameObject.Find("Music").GetComponent(AudioSource).Play();
	}
	m_MenuPos.x = -Screen.width;
	m_FadePos.x = -Screen.width;
	
	
}

function Update () {

	if(m_Life > 0)
	{
		m_Life -= Time.deltaTime;
		GetComponent(GUIScript).m_Rect.width =  1-(m_Life/m_Lifetime);
		
		if(m_Life  <= 0)
		{
			var rot:Quaternion = Quaternion.identity;
			rot.eulerAngles = Vector3(0,180,280);
			var flag:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/Flag"),Camera.main.transform.position + Vector3(-18,12,26), rot);
			
			
			rot.eulerAngles = Vector3(0,180,260);
			var flag2:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/Flag_Backwards"),Camera.main.transform.position + Vector3(18.6,12,26), rot);
			
			
			
			
		
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
			var count:int = 0;
			
			
			var numWinners:int = 0;
			for(var player :GameObject in m_Players)
			{
				if(player.GetComponent(BeeScript).m_Team == GameStateManager.m_WinningTeam)
					numWinners++;
			}
			
			for(var player :GameObject in m_Players)
			{
			
			
				if(player.GetComponent(BeeScript).m_Team == GameStateManager.m_WinningTeam)
				{
					var c:ClientNetworkInfo = NetworkUtils.GetClientObjectFromGameObject(player);
					flag.transform.Find("InteractiveCloth").renderer.material.color	= c.m_Color;
					flag2.transform.Find("InteractiveCloth").renderer.material.color	= c.m_Color;
					
					if(GameStateManager.m_WinningTeam == 0)
					{
						flag.transform.Find("InteractiveCloth").renderer.material.mainTexture = GameObject.Find("GameServer").GetComponent(MultiplayerLobbyGUI).m_Team1IconTexture;
						flag2.transform.Find("InteractiveCloth").renderer.material.mainTexture = GameObject.Find("GameServer").GetComponent(MultiplayerLobbyGUI).m_Team1IconTexture;
					}
					else
					{
						flag.transform.Find("InteractiveCloth").renderer.material.mainTexture = GameObject.Find("GameServer").GetComponent(MultiplayerLobbyGUI).m_Team2IconTexture;
						flag2.transform.Find("InteractiveCloth").renderer.material.mainTexture = GameObject.Find("GameServer").GetComponent(MultiplayerLobbyGUI).m_Team2IconTexture;
					}
					count++;
					Camera.main.fov = 60;
					var bee:GameObject = GameObject.Instantiate(GameObject.Find(player.name+"/Bee"));
					bee.name = bee.name + count;
					if( count % 2)
					{
						bee.animation.Stop();
						GameObject.Find(bee.name+"/NewBee").animation.Stop();
						GameObject.Find(bee.name+"/NewBee").animation.Play("celebrate");
						GameObject.Find(bee.name+"/NewBee").animation["celebrate"].speed = 0.75;
					}
					else
					{
						//bee.animation.Stop();
						bee.animation.Stop();
						GameObject.Find(bee.name+"/NewBee").animation.Stop();
						GameObject.Find(bee.name+"/NewBee").animation.Play("celebrate");
						GameObject.Find(bee.name+"/NewBee").animation["celebrate"].time = 1;
						GameObject.Find(bee.name+"/NewBee").animation["celebrate"].speed = 0.65;
					}
					GameObject.Find(bee.name+"/NewBee/NewBee").layer = LayerMask.NameToLayer("FullScreenGUI");
					GameObject.Find(bee.name+"/NewBee/BeeArmor").layer = LayerMask.NameToLayer("FullScreenGUI");
					if(GameObject.Find(bee.name+"/NewBee/body/head/swag") != null)
						GameObject.Find(bee.name+"/NewBee/body/head/swag").layer = LayerMask.NameToLayer("FullScreenGUI");
					bee.layer = LayerMask.NameToLayer("FullScreenGUI");
					var t:GameObject = new GameObject();
					bee.transform.parent = t.transform;
					t.AddComponent(BeeBlinkScript);
					var posOffset:float = (numWinners-1)/2.0;
					bee.transform.position = Camera.main.transform.position + Camera.main.transform.forward *  15 + Vector3.right * 12 * (count-1-posOffset);
					if(GameStateManager.m_MVPPlayer == player.name)
					{
						bee.transform.localScale= Vector3(3,3,3);
						bee.transform.position.y = -10;
					}
					else
						bee.transform.localScale= Vector3(0,0,0);
					bee.transform.eulerAngles.x = 300;
					bee.renderer.enabled = true;
					
					m_Bees.Add(bee);
					//GetComponent(GUIScript).enabled = true;
				}
				player.active = false;
			}
			var parts:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/SunrayParticles"));
			parts.transform.position = Camera.main.transform.position+ Camera.main.transform.forward *  350;
			parts.transform.LookAt(Camera.main.transform.position);
			parts.layer = LayerMask.NameToLayer("FullScreenGUI");
			Camera.main.orthographic = true;
			Camera.main.orthographicSize = 15;
			
			GetComponent(GUIScript).m_Rect.y = -2;
			GetComponent(GUIScript).m_Img = m_CrownTexture;
			GetComponent(GUIScript).m_ImgColor = Color.white;
			GetComponent(GUIScript).m_Color = Color.white;
			GetComponent(GUIScript).m_FontSize = 32;
		}	
	}	
	
	for(var k:int = 0; k < m_Bees.length; k++)
	{
		bee = m_Bees[k];
		if(bee != null)
		{
			//StopCoroutine("ShowWinnerText");
			var scale:float = bee.transform.localScale.x;
			scale = Mathf.Lerp(scale, 1.5, Time.deltaTime*5);
			if(1.5 - scale > 0.1)
				bee.transform.localScale = Vector3(scale, scale, scale);
		}
	}
	if(m_Bees .length > 0 )
	{
		
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
	var str:String = "Team "+(GameStateManager.m_WinningTeam+1)+" Wins!";
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
	yield WaitForSeconds(1);
	
	
	while(m_MenuPos.x != 0)
	{
		m_MenuPos.x = Mathf.Lerp(m_MenuPos.x,0,0.0166*20);
		if(Mathf.Abs(m_MenuPos.x) < 1)
			break;
		for( var bee:GameObject in m_Bees)
		{
			bee.transform.eulerAngles.y += 4;
		}
		yield WaitForSeconds(0.0166);
	}
	
	while(Input.GetAxis("Joy0 OK") == 0.0)
	{
		for( var bee:GameObject in m_Bees)
		{
			bee.transform.eulerAngles.y += 4;
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
	
	while(m_FadePos.x != 0)
	{
		m_FadePos.x = Mathf.Lerp(m_FadePos.x,0,0.0166*10);
		if(Mathf.Abs(m_FadePos.x) < 1)
			break;
		// for( var bee:GameObject in m_Bees)
		// {
			// bee.transform.eulerAngles.y += 4;
		// }
		 yield WaitForSeconds(0.0166);
	}
	
	
	var done:boolean = false;
	// while(!done)
	// {
		// for( var bee:GameObject in m_Bees)
		// {
			// var anim :GameObject = GameObject.Find(bee.name+"/NewBee");
			// anim.animation.Stop();
			// if(bee != null && bee.transform.localEulerAngles.x > 0.01 && bee.transform.localEulerAngles.y > 0.01)
			// {
				// bee.transform.rotation = Quaternion.Slerp(bee.transform.rotation, Quaternion.identity, 15/60.0);
				
			// }
			// else
			// {
				// done = true;
			// }
		// }
		// Camera.main.orthographicSize += Time.deltaTime * 1000;
		// yield WaitForSeconds(1/30.0);
	// }
	// while(m_Bee != null && m_Bee.transform.localEulerAngles.x > 0.01 && m_Bee.transform.localEulerAngles.y > 0.01)
	// {
		// m_Bee.transform.rotation = Quaternion.Slerp(m_Bee.transform.rotation, Quaternion.identity, 15/60.0);
		// yield WaitForSeconds(1/60.0);
	// }
	
	// while(Camera.main.orthographicSize < 500)
	// {
		// Camera.main.orthographicSize += Time.deltaTime * 1000;
		// yield WaitForSeconds(1/60.0);
	// }
	
	for( var bee:GameObject in m_Bees)
	{
		bee.active = false;
	}
	
	// while(Camera.main.GetComponent(GlobalFog).globalDensity < 0.01)
	// {
		// Camera.main.GetComponent(GlobalFog).globalDensity += .0001;
		// yield WaitForSeconds(1/60.0);
	// }
	
	if(Network.isServer)
	{
		GameObject.Find("GameServer").GetComponent(ServerScript).InitiateMatchShutdown();
	}
}

function OnGUI()
{
	
		//m_GUISkin.label.fixedWidth = Screen.width/5.0;
		GUI.color = Color.black;
		if(m_FadePos.x > -Screen.width+1)
		{
			GUI.BeginGroup (Rect(m_FadePos.x, 0, Screen.width+5,Screen.height+5), m_GUISkin.GetStyle("Background"));	
			GUI.EndGroup();
		}
		GUI.color = Color(0,0,0,0.75);
		GUI.BeginGroup (Rect(m_MenuPos.x, Screen.height*.30, Screen.width,Screen.height*0.5), m_GUISkin.GetStyle("Background"));	
			GUI.color = Color.white;
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
		GUI.color = Color.white;
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
			
			var team1Count:int = 0;
			var team2Count:int = 0;
			
			for(var p:int = 0; p < players.Count; p++)
			{
				//GUILayout.BeginHorizontal();
				
				//GUILayout.Label(m_Players[p].name, m_GUISkin.label);
				//GUILayout.Label("1000", m_GUISkin.label);
				//GUILayout.Label("15", m_GUISkin.label);
				//GUILayout.Label("23", m_GUISkin.label);
				//GUILayout.Label("8", m_GUISkin.label);
				
				
				var c:ClientNetworkInfo = NetworkUtils.GetClientObjectFromGameObject(players[p]);
				var y:float = 0;
				if(c.m_Side == GameStateManager.m_WinningTeam)
				{
					y = (team1Count+1) * m_GUISkin.label.fontSize*1.1;
					team1Count++;
				}
				else
				{
					y = (team2Count+1) * m_GUISkin.label.fontSize*1.1 + 164;
					team2Count++;
					
				}
				GUI.backgroundColor = c.m_Color;
				GUI.backgroundColor.a = 0.4;
				if(players[p].name == GameStateManager.m_MVPPlayer)
				{
					GUI.Label(Rect(0,y,width, 32),"       "+c.m_Name, m_GUISkin.label);
					var scale = Mathf.Sin(Time.time*8)*8;
					GUI.DrawTexture(Rect(4-scale*0.5,y-scale*0.5,32+scale, 32+scale),m_CrownTexture);
				}
				else
				{
					//GUI.color = c.m_Color;
					GUI.Label(Rect(0,y,width, 32),"       "+c.m_Name, m_GUISkin.label);
					//GUI.color = Color.white;
				}
				
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