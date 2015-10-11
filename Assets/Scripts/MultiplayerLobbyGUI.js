
#pragma strict
class LevelPrev
{
	var m_Tex : Texture2D = null;
	var m_Name : String = null;
}


class LocalPlayerLobbyState
{
	var m_Joined:boolean = false;
	var m_TeamChosen:boolean = false;
	var m_ColorChosen : boolean = false;
	var m_Ready : boolean = false;
	var m_Swag : String = null;
	var m_SwagIndex : int = -1;
	var m_Color:Color;
	var m_Team : int = 0;
}

var Style : GUIStyle;
var m_GUISkin : GUISkin;
var m_LevelPreviews : LevelPrev[];
var m_PlayerStates : LocalPlayerLobbyState[] = new LocalPlayerLobbyState[4];
var m_MenuSelectSound:AudioClip = null;
var m_MenuSound:AudioClip = null;
var m_MenuBack:AudioClip = null;
private var m_LevelIndex : int = 0;

static var m_HostListTimeout : float = 10;
private var m_HostListWaitTimer : float = 0;
private var m_MenuPos:Vector2;

public var m_BeeTexture:RenderTexture;
public var m_ColorStripTexture:Texture2D = null;
public var m_TeamColorTexture:Texture2D = null;
public var m_Team1IconTexture:Texture2D = null;
public var m_Team2IconTexture:Texture2D = null;
public var m_SkinPrevTexture:Texture2D = null;
public var m_WhitePix:Texture2D = null;

public var m_StartMatch:boolean = false;
public var m_ReturnToMain:boolean = false;
public var m_LocalPlayerScreen:boolean = true;

var pLastInput:float[] = new float[4];
var pColorIndices:int[] = new int[4];
var TeamColorIndex:int = 0;
public var m_IsAnimating:boolean = false;


function GetHosts()
{
	//MasterServer.ipAddress = "127.0.0.1";
	MasterServer.RequestHostList("BeeHappy");
	m_HostListWaitTimer = m_HostListTimeout;
}

function Awake()
{
	m_MenuPos = Vector2(-Screen.width, Screen.height*0.25);
	
}

function Start () {

	if(!Network.isServer)
	{
		GetHosts();		
	}
	
	
	for(var i:int = 0; i < 4; i++)
	{
		pColorIndices[i] = 1;
	}
	//m_PlayerStates[0].m_Joined = true;
	
	TeamColorIndex = Random.Range(0,8);
	//var armor:GameObject = GameObject.Find("Bee1/NewBee/BeeArmor").gameObject;
	//armor.renderer.materials[0].color = m_TeamColorTexture.GetPixel(TeamColorIndex+1,1);
}

function OnEnable()
{
	//Debug.Log("Enabling");

	for(var i:int = 0; i < 4; i++)
	{	
		if(m_PlayerStates[i].m_Ready)
		{
			GameObject.Find("P"+(i+1)+"_Text").animation.Play();
			
			if(Network.isServer)
			{
				gameObject.Find("BeeCamera").animation.Stop();
				gameObject.Find("BeeCamera").animation["LobbyPlayerCamIntro"].time = gameObject.Find("BeeCamera").animation["LobbyPlayerCamIntro"].length;
				
				
				GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.material.color = GetComponent(ServerScript).GetClient(i).m_SkinColor;
				
				GameObject.Find("P"+(i+1)+"_Text").animation.Stop();
				GameObject.Find("P"+(i+1)+"_Text").transform.parent.parent.gameObject.animation.Stop();
				 GameObject.Find("P"+(i+1)+"_Text").transform.position.y += 4.5;
				 GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "Ready!";
				 GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_ImgColor.a = 0;
				 GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Color.a = 1;
				
				
				GameObject.Find("Bee"+(i+1)).animation.enabled = true;
				GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.enabled = true;
				if(GameObject.Find("Bee"+(i+1)+"/NewBee/body/head/swag") != null)
					GameObject.Find("Bee"+(i+1)+"/NewBee/body/head/swag").renderer.enabled = true;
				GameObject.Find("Bee"+(i+1)+"/NewBee/BeeArmor").renderer.enabled = true;
				var swag:GameObject = GameObject.Find("Swag");
				var armor:GameObject = GameObject.Find("Bee"+(i+1)+"/NewBee/BeeArmor").gameObject;
				armor.renderer.materials[0].color = GetComponent(ServerScript).GetClient(i).m_Color;
				if(m_PlayerStates[i].m_SwagIndex != -1)
				{
					var currSwag:GameObject = GameObject.Instantiate(swag.transform.GetChild(m_PlayerStates[i].m_SwagIndex).gameObject);
					m_PlayerStates[i].m_Swag = swag.transform.GetChild(m_PlayerStates[i].m_SwagIndex).gameObject.name;
					currSwag.name = "swag";
					currSwag.transform.parent = null;
					currSwag.transform.parent = GameObject.Find("Bee"+(i+1)+"/NewBee/body/head").transform;
					currSwag.transform.position = currSwag.transform.parent.position;
					currSwag.transform.rotation = currSwag.transform.parent.rotation;
					currSwag.transform.localEulerAngles.z = 180;
					currSwag.transform.localScale = Vector3(1,1,1);
				}
			}
		}
	}
}

function ResetMenu(left:boolean)
{
	if(left)
		m_MenuPos = Vector2(-Screen.width, Screen.height*0.25);
	else
		m_MenuPos = Vector2(Screen.width, Screen.height*0.25);
}

function MenuEnter(fwrd:boolean)
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
		
		
	m_IsAnimating = true;
	ResetMenu(fwrd);
	m_LocalPlayerScreen = !m_LocalPlayerScreen;
	
	if(m_LocalPlayerScreen && fwrd)
	{
		m_MenuPos.x = 0;
	}
	else
	{
		while(m_MenuPos.x != 0)
		{
			m_MenuPos.x = Mathf.Lerp(m_MenuPos.x,0,0.0166*20);
			if(Mathf.Abs(m_MenuPos.x) < 1)
				break;
			yield WaitForSeconds(0.0166);
		}
	}
	m_IsAnimating = false;		
	if(m_LocalPlayerScreen)
	{
		for(var i:int = 0; i < m_PlayerStates.length; i++)
		{
			GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).enabled = true;
		}
	}
}

function MenuExit(fwrd:boolean)
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
	m_IsAnimating = true;
	var vel:float = Screen.width*0.5;
	var accel :float = Screen.width*40;
	if(fwrd)
	{
		
		while(Mathf.Abs(m_MenuPos.x) <  Screen.width)
		{
			vel += accel * 0.0166;
			m_MenuPos.x += vel*0.0166;//Mathf.Lerp(m_MenuPos.x,Screen.width,0.0166*20);
			yield WaitForSeconds(0.0166);
		}
	}
	else
	{
		while(m_MenuPos.x > -Screen.width)
		{
			vel += accel * 0.0166;
			m_MenuPos.x -= vel*0.0166;
			yield WaitForSeconds(0.0166);
		}
	}
	
	m_IsAnimating = false;
}

function CameraOutro()
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
	m_IsAnimating = true;
	gameObject.Find("Title").animation.Stop();
	gameObject.Find("Title").animation["TitleMapMenu"].time = gameObject.Find("Title").animation["TitleMapMenu"].length;
	gameObject.Find("Title").animation["TitleMapMenu"].speed = -1;
	gameObject.Find("Title").animation.Play();
	Camera.main.animation.Play("CameraMapMenuReturn");
	yield WaitForSeconds(Camera.main.animation["CameraMapMenuReturn"].length);
	m_IsAnimating = false;
	if(Network.isServer)
		gameObject.Destroy(gameObject.Find("GameServer"));
	else
		gameObject.Destroy(gameObject.Find("GameClient"));
	
	Application.LoadLevel(0);
}

function CameraStart()
{
	while(m_IsAnimating)
		yield WaitForSeconds(0.0166);
	m_IsAnimating = true;
	gameObject.Find("Title").animation.Stop();
	gameObject.Find("Title").animation["TitleMapMenu"].time = gameObject.Find("Title").animation["TitleMapMenu"].length;
	gameObject.Find("Title").animation["TitleMapMenu"].speed = -1;
	gameObject.Find("Title").animation.Play();
	Camera.main.animation.Play("CameraMapMenuExit");
	
	yield WaitForSeconds(Camera.main.animation["CameraMapMenuExit"].length);
	m_IsAnimating = false;
	StartMatch();
}

function Update () {

	gameObject.Find("BeeCamera").camera.targetTexture = m_BeeTexture;
	
	if(m_LocalPlayerScreen)
	{
		for(var i:int = 0; i < m_PlayerStates.length; i++)
		{
			if(Input.GetButtonDown("Joy"+i+" OK") && !m_PlayerStates[i].m_Joined && !GameObject.Find("BeeCamera").animation.isPlaying)
			{
				if(Network.isServer)
				{
					var plr : NetworkPlayer;
					GetComponent(ServerScript).OnLocalPlayerConnected(plr, i);
					
					var avatar:GameObject = GameObject.Find("P"+(i+1));
					//GameObject.Find("P"+(i+1)+"_Text").active = false;
					GameObject.Find("P"+(i+1)+"_Text").animation.Stop();
					GameObject.Find("P"+(i+1)+"_Text").transform.parent.parent.gameObject.animation.Stop();
					GameObject.Find("P"+(i+1)+"_Text").transform.position.y += 4.5;
					GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_ImgColor.a = 0;
					GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Color.a = 1;
					avatar.animation.Play();
					var armor:GameObject = GameObject.Find("Bee"+(i+1)+"/NewBee/BeeArmor").gameObject;
					
					if(i%2 == 0)
					{
						armor.renderer.materials[0].color = m_TeamColorTexture.GetPixel(TeamColorIndex,0);
						m_PlayerStates[i].m_Team = 0;
						GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_Img = m_Team1IconTexture;
						GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_ImgColor = armor.renderer.materials[0].color;
					}
					else
					{
						armor.renderer.materials[0].color = m_TeamColorTexture.GetPixel(TeamColorIndex+1,0);
						m_PlayerStates[i].m_Team = 1;
						GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_Img = m_Team2IconTexture;
						GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_ImgColor = armor.renderer.materials[0].color;
					}
					
				GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.material.color = GetComponent(ServerScript).GetClient(i).m_SkinColor;
				GameObject.Find("Bee"+(i+1)).animation.enabled = true;
				GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.enabled = true;
				if(GameObject.Find("Bee"+(i+1)+"/NewBee/body/head/swag") != null)
					GameObject.Find("Bee"+(i+1)+"/NewBee/body/head/swag").renderer.enabled = true;
				GameObject.Find("Bee"+(i+1)+"/NewBee/BeeArmor").renderer.enabled = true;
			
					m_PlayerStates[i].m_Joined = true;
					GameObject.Find("Bee"+(i+1)).animation.enabled = true;
					//GameObject.Find("Bee"+(i+1)).renderer.enabled = true;
					AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
					var go:GameObject = GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
					go.animation.Stop("FlashIntro");
					go.animation["FlashIntro"].time = 2.35;
					go.animation.Play("FlashIntro");
					
				}
			}
			else
			//player is choosing team			
			if(m_PlayerStates[i].m_Joined)
			{
				
				var bee:GameObject = GameObject.Find("Bee"+(i+1));
				bee.transform.eulerAngles.y += Time.deltaTime * 360*Input.GetAxis("Joy"+i+" Look Left/Right");
				if(!m_PlayerStates[i].m_TeamChosen)
				{
					var currInput:float = Input.GetAxis("Joy"+i+" Strafe Left/Right");
					GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "< Choose Team >";
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).enabled = true;
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_ImgColor = m_TeamColorTexture.GetPixel(TeamColorIndex+m_PlayerStates[i].m_Team,0);;
					if(m_PlayerStates[i].m_Team == 0)
						GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_Img = m_Team1IconTexture;
					else
						GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_Img = m_Team2IconTexture;	
					
					if(currInput != 0 && pLastInput[i] == 0)
					{
						armor = GameObject.Find("Bee"+(i+1)+"/NewBee/BeeArmor").gameObject;
						if(armor.renderer.materials[0].color == m_TeamColorTexture.GetPixel(TeamColorIndex,0))
						{
							armor.renderer.materials[0].color = m_TeamColorTexture.GetPixel(TeamColorIndex+1,0);
							m_PlayerStates[i].m_Team = 1;
						}
						else
						{
							armor.renderer.materials[0].color = m_TeamColorTexture.GetPixel(TeamColorIndex,0);
							m_PlayerStates[i].m_Team = 0;
						}
				
							
						
						AudioSource.PlayClipAtPoint(m_MenuSelectSound, Camera.main.transform.position);			
						
						if(Network.isServer)
						{
							for(var k:int =0 ; k < 4; k++)
							{
								if(GetComponent(ServerScript).GetClient(k) != null)
								{
									if(GetComponent(ServerScript).GetClient(k).m_JoyNum == i)
										GetComponent(ServerScript).GetClient(k).m_SkinColor = GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.materials[0].color;
								}
							}
						}
					
					}
					pLastInput[i] = currInput;
					if(Input.GetButtonDown("Joy"+i+" OK"))
					{
						m_PlayerStates[i].m_TeamChosen = true;
						GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "< Choose Skin >";
						//GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).enabled = false;
						AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
					}
					
					if(Input.GetButtonDown("Joy"+i+" Cancel"))
					{
							if( i == 0)
							{
								AudioSource.PlayClipAtPoint(m_MenuBack, Camera.main.transform.position);
								MenuExit(false);
								for(var t:int = 0; t < m_PlayerStates.length; t++)
								{
									m_PlayerStates[t].m_Joined = false;
									GameObject.Find("P"+(t+1)+"_Text").GetComponent(GUIScript).enabled = false;
									GameObject.Find("P"+(t+1)+"_TeamIcon").GetComponent(GUIScript).enabled = false;
								}
								CameraOutro();
							}
					}
				}
				else	
				if(!m_PlayerStates[i].m_ColorChosen)
				{
					
					
					currInput = Input.GetAxis("Joy"+i+" Strafe Left/Right");
					GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "< Choose Skin >";
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).enabled = true;
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_Img = m_SkinPrevTexture;
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).m_ImgColor = m_ColorStripTexture.GetPixel(pColorIndices[i],1);
					if(currInput != 0 && pLastInput[i] == 0)
					{
						if(currInput > 0)
						{
							pColorIndices[i] += 1;
						}
						else
						{
							pColorIndices[i] -= 1;
						}
						GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.materials[0].color = m_ColorStripTexture.GetPixel(pColorIndices[i],1);
						
						AudioSource.PlayClipAtPoint(m_MenuSelectSound, Camera.main.transform.position);			
						
						if(Network.isServer)
						{
							for(k =0 ; k < 4; k++)
							{
								if(GetComponent(ServerScript).GetClient(k) != null)
								{
									if(GetComponent(ServerScript).GetClient(k).m_JoyNum == i)
										GetComponent(ServerScript).GetClient(k).m_SkinColor = GameObject.Find("Bee"+(i+1)+"/NewBee/NewBee").renderer.materials[0].color;
								}
							}
						}
					
					}
					pLastInput[i] = currInput;
					if(Input.GetButtonDown("Joy"+i+" OK"))
					{
						m_PlayerStates[i].m_ColorChosen = true;
						GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "< Swag Up >";
						AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
					}
					
					if(Input.GetButtonDown("Joy"+i+" Cancel"))
					{
							if( i == 0)
							{
								m_PlayerStates[i].m_TeamChosen = false;
								AudioSource.PlayClipAtPoint(m_MenuBack, Camera.main.transform.position);
							}
					}
	
				}
				
				//player chooses swag
				else if(!m_PlayerStates[i].m_Ready)
				{
					//player is selecting swag
					currInput = Input.GetAxis("Joy"+i+" Strafe Left/Right");
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).enabled = false;
					if(currInput != 0 && pLastInput[i] == 0)
					{
						var currSwag:GameObject = GameObject.Find("Bee"+(i+1)+"/NewBee/body/head/swag");
						var swag:GameObject = GameObject.Find("Swag");
						AudioSource.PlayClipAtPoint(m_MenuSelectSound, Camera.main.transform.position);	
						if(currInput > 0)
						{
							m_PlayerStates[i].m_SwagIndex++;
							if(m_PlayerStates[i].m_SwagIndex >= swag.transform.childCount)
								m_PlayerStates[i].m_SwagIndex = -1;
							
						}
						else
						{
							m_PlayerStates[i].m_SwagIndex--;
							if(m_PlayerStates[i].m_SwagIndex < -1)
								m_PlayerStates[i].m_SwagIndex = swag.transform.childCount-1;
						}
						
						if(currSwag != null)
							Destroy(currSwag);
						
						if(m_PlayerStates[i].m_SwagIndex != -1)
						{							
							currSwag = GameObject.Instantiate(swag.transform.GetChild(m_PlayerStates[i].m_SwagIndex).gameObject);
							m_PlayerStates[i].m_Swag = swag.transform.GetChild(m_PlayerStates[i].m_SwagIndex).gameObject.name;
							currSwag.name = "swag";
							currSwag.transform.parent = null;
							currSwag.transform.parent = GameObject.Find("Bee"+(i+1)+"/NewBee/body/head").transform;
							currSwag.transform.position = currSwag.transform.parent.position;
							currSwag.transform.rotation = currSwag.transform.parent.rotation;
							currSwag.transform.localEulerAngles.z = 180;
							currSwag.transform.localScale = Vector3(1,1,1);
							GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = m_PlayerStates[i].m_Swag;
						}
						else
						{
							m_PlayerStates[i].m_Swag = "";
							GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "< Swag Up >";
						}
						
						
						if(Network.isServer)
						{
							for(k =0 ; k < 4; k++)
							{
								if(GetComponent(ServerScript).GetClient(k) != null)
								{
									if(GetComponent(ServerScript).GetClient(k).m_JoyNum == i)
										GetComponent(ServerScript).GetClient(k).m_Swag = m_PlayerStates[i].m_Swag;
								}
							}
						}
						
					}
					pLastInput[i] = currInput;
					
					if(Input.GetButtonDown("Joy"+i+" OK"))
					{
						m_PlayerStates[i].m_Ready = true;
						GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "Ready!";
						//client is readied
						if(Network.isServer)
						{
							for(k =0 ; k < 4; k++)
							{
								if(GetComponent(ServerScript).GetClient(k) != null)
								{
									if(GetComponent(ServerScript).GetClient(k).m_JoyNum == i)
									{
									
										GetComponent(ServerScript).GetClient(k).m_Side = m_PlayerStates[i].m_Team;
										GetComponent(ServerScript).GetClient(k).m_Color = m_TeamColorTexture.GetPixel(TeamColorIndex+m_PlayerStates[i].m_Team,0);
										
									}
								}
							}
						}
					}
					else if(Input.GetButtonDown("Joy"+i+" Cancel"))
					{
						m_PlayerStates[i].m_ColorChosen = false;
						AudioSource.PlayClipAtPoint(m_MenuBack, Camera.main.transform.position);
					}
				}
				else if(m_PlayerStates[i].m_Ready)
				{
					if(Input.GetButtonDown("Joy"+i+" Cancel"))
					{
						m_PlayerStates[i].m_Ready = false;
						GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).m_Text = "< Swag Up >";
						AudioSource.PlayClipAtPoint(m_MenuBack, Camera.main.transform.position);
					}
				}
				
			}
		}
	}
	
	if(Input.GetButtonDown("Joy0 OK") && !m_IsAnimating && m_PlayerStates[0].m_Ready)
	{
		var allJoined:boolean = true;
		for(i = 0; i < m_PlayerStates.length; i++)
		{
			if(m_PlayerStates[i].m_Joined && !m_PlayerStates[i].m_Ready)
			{
				allJoined = false;
				break;
			}
		}
		
		if(allJoined)
		{
			if(m_LocalPlayerScreen)
			{
				for(i = 0; i < m_PlayerStates.length; i++)
				{
					GameObject.Find("P"+(i+1)+"_Text").GetComponent(GUIScript).enabled = false;
					GameObject.Find("P"+(i+1)+"_TeamIcon").GetComponent(GUIScript).enabled = false;
					
				}	
				AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
				go= GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
				go.animation.Stop("FlashIntro");
				go.animation["FlashIntro"].time = 2.35;
				go.animation.Play("FlashIntro");
				MenuExit(true);
				MenuEnter(true);
				if(Network.isServer)
				{
					MasterServer.RegisterHost("BeeHappy", SystemInfo.deviceName, "Bzzz death to all!");
				}
				
			}
			else
			{
				AudioSource.PlayClipAtPoint(m_MenuSound, Camera.main.transform.position);
				go= GameObject.Instantiate(Resources.Load("GameObjects/ScreenFlash"), Vector3(0.5, 0.5, 0), Quaternion.identity);
				go.animation.Stop("FlashIntro");
				go.animation["FlashIntro"].time = 2.35;
				go.animation.Play("FlashIntro");
				MenuExit(true);
				CameraStart();
				
			}
		}		
	}
	
	if(Input.GetButtonDown("Joy0 Cancel"))
	{
		if(m_LocalPlayerScreen)
		{
			//m_PlayerStates[0].m_Ready
		}
		else
		{
			AudioSource.PlayClipAtPoint(m_MenuBack, Camera.main.transform.position);
			MenuExit(false);
			MenuEnter(false);
			
			
		}
	}
	

	if(!Network.isServer)
	{
		if(gameObject.Find("Title") != null)
			gameObject.Find("Title").active = false;
	}
	else
	{
		networkView.RPC("SetLevelPreviewIndex", RPCMode.Others,m_LevelIndex);
	}
}

function OnLevelWasLoaded(L:int)
{
	if(L == 4)
	{
		m_IsAnimating = true;
		yield WaitForSeconds(0.75);
		m_IsAnimating = false;
		MenuEnter(true);
		
		var anybodyReady:boolean = false;
		for(var i:int = 0; i < 4; i++)
		{	
			if(m_PlayerStates[i].m_Ready)
			{
				anybodyReady = true;
			}
		}
		
		if(!anybodyReady)
			GameObject.Find("BeeCamera").animation.Play();
		else
		{
			for(i = 0; i < 4; i++)
			{	
				GameObject.Find("P"+(i+1)+"_Platform").renderer.enabled = true;
			}
			// m_LocalPlayerScreen = false;
			// ResetMenu(true);
			// MenuEnter(true);
			
		}
	}
}



function WaitForExitAnimation()
{

	
}

function StartMatch()
{
	m_StartMatch = false;
	if(Network.isServer)
	{
		GetComponent(ServerScript).m_ConnectMsgsView.RPC("LoadLevel", RPCMode.Others, "Scene2");
		GetComponent(ServerScript).LoadLevel("Scene2");
	}
	
}


function OnGUI()
{	
	if(m_LocalPlayerScreen)
	{
		var width : float = 800;
		
		GUILayout.BeginArea (Rect(m_MenuPos.x, 0, Screen.width,Screen.height));		
			gameObject.Find("BeeCamera").camera.Render();
			GUI.DrawTexture(Rect(0, 0 ,Screen.width, Screen.height),m_BeeTexture);
		GUILayout.EndArea();

		return;
	}


	if(Network.isServer)
	{
		
		//var width : float = 800;
		GUI.backgroundColor = Color(0,0,0,1);
		GUILayout.BeginArea (Rect(m_MenuPos.x, m_MenuPos.y, 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
			
			//GUILayout.BeginVertical();
				GUI.backgroundColor = Color(0,0,0,1);
				m_GUISkin.label.alignment = TextAnchor.UpperCenter;
				//GUILayout.Label("<", m_GUISkin.label);
				GUI.backgroundColor = Color(0,0,0,1);
				GUILayout.Label(m_LevelPreviews[m_LevelIndex].m_Name, m_GUISkin.label);
				
				//GUILayout.Label(">", m_GUISkin.label);
				//GUI.backgroundColor = Color.white;
			
			
			//GUI.backgroundColor = Color(0,0,0,0.5);
			
			GUILayout.Label( m_LevelPreviews[m_LevelIndex].m_Tex,GUILayout.Height(512));
			GUILayout.Label( m_LevelPreviews[m_LevelIndex].m_Tex);
			GUILayout.Label( "Select Map", m_GUISkin.label);
			GUI.backgroundColor = Color.white;
			//GUILayout.EndVertical();
		GUILayout.EndArea();
		GUI.backgroundColor = Color(0,0,0,0.75);
	
		GUILayout.BeginArea (Rect(m_MenuPos.x+512, m_MenuPos.y, Screen.width - 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
		var comp : ServerScript = GetComponent(ServerScript) as ServerScript;
		if(comp.GetNumClients() == 0)
		{
			GUILayout.Label("Waiting for other players to join...");
		}
		else
		{
			var m_Players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
			if(m_Players != null)
			{
				var rankedClients = new List.<ClientNetworkInfo>();
				for(var p : int = 0; p < comp.GetNumClients(); p++)
				{
					rankedClients.Add(comp.GetClient(p));
				}
				rankedClients.Sort(GameStateManager.CompareLeaders);
				
				var team1Count:int = 0;
				var team2Count:int = 0;
				//set the headings
				
				var leaderboardXOffset:float = 32; 
				width = (Screen.width-512)/3;
				
				m_GUISkin.label.alignment = TextAnchor.UpperLeft;
				GUI.backgroundColor.a = 0.0;
				GUI.Label(Rect(leaderboardXOffset,0,width, m_GUISkin.label.fontSize),"Name", m_GUISkin.label);
				//GUI.Label(Rect(width,0,width, m_GUISkin.label.fontSize),"Name", m_GUISkin.label);
				GUI.Label(Rect(width+leaderboardXOffset,0,width, m_GUISkin.label.fontSize),"Rank", m_GUISkin.label);
				GUI.Label(Rect(width*2+leaderboardXOffset,0,width, m_GUISkin.label.fontSize),"Score", m_GUISkin.label);
				
				//draw the ranked list of clients
				for(p  = 0; p < rankedClients.Count; p++)
				{	
					
					var c:ClientNetworkInfo = rankedClients[p];
					var y:float = 0;
					if(c.m_Side == 0)
					{
						y = (team1Count+1) * m_GUISkin.label.fontSize*1.1+64;
						if(team1Count == 0)
						{
							GUI.color = c.m_Color;
							//GUI.color.a = 0.4;
							GUI.Label(Rect(leaderboardXOffset,y-64,64, 64),m_Team1IconTexture);
							GUI.color = Color.white;	
						}
						team1Count++;
					}
					else
					{
						y = (team2Count+1) * m_GUISkin.label.fontSize*1.1 + 164+64;
						if(team2Count == 0)
						{
							GUI.color = c.m_Color;
							//GUI.color.a = 0.4;
							GUI.Label(Rect(leaderboardXOffset,y-64,64, 64),m_Team2IconTexture);
							GUI.color = Color.white;
						}
						team2Count++;
						
					}
					GUI.backgroundColor = c.m_Color;
					GUI.backgroundColor.a = 0.4;
					
					//GUI.color = c.m_Color;
					
					GUI.Label(Rect(leaderboardXOffset,y,width, 32),"       "+c.m_Name, m_GUISkin.label);
					GUI.Label(Rect(width+leaderboardXOffset,y,width, 32)," "+(p+1), m_GUISkin.label);
					GUI.Label(Rect(width*2+leaderboardXOffset,y,width-64, 32)," "+c.m_TotalScore, m_GUISkin.label);
					
				}
				m_GUISkin.label.alignment = TextAnchor.MiddleCenter;
			}	
			// GUI.backgroundColor = new Color(0,0,0,0.5);
			// for(var i : int = 0; i < comp.GetNumClients(); i++)
			// {
				// GUILayout.Label(comp.GetClient(i).m_Name, m_GUISkin.label);		
			// }
			// if(comp.GetNumClients() == 1)
			// {
				// GUILayout.Label("Waiting for other players to join...", m_GUISkin.label);	
			// }
			// GUI.backgroundColor = Color.white;
		}
		GUILayout.EndArea();
	}
	else
	{
		width = 800;
		GUILayout.BeginArea (Rect(m_MenuPos.x, m_MenuPos.y, Screen.width,Screen.height*0.5), m_GUISkin.customStyles[0]);
		
		
		
		var cliScript:ClientScript = gameObject.Find("GameClient").GetComponent(ClientScript);
		if(cliScript.GetNumClients() > 0)
		{
			GUILayout.BeginArea (Rect(0, 0, 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
				GUI.backgroundColor = new Color(0,0,0,0.5);
				GUILayout.Label(m_LevelPreviews[m_LevelIndex].m_Name, m_GUISkin.label);
				GUILayout.Label( m_LevelPreviews[m_LevelIndex].m_Tex,  m_GUISkin.label,GUILayout.MaxHeight(64));
				GUI.backgroundColor = Color.white;
				if(GUILayout.Button("Return to Main Menu", m_GUISkin.button))
				{
					gameObject.Destroy(gameObject.Find("GameClient"));
					Application.LoadLevel(0);
				}
			GUILayout.EndArea();
			GUILayout.BeginArea (Rect(m_MenuPos.x+512, 0, Screen.width - 512,Screen.height*0.5), m_GUISkin.customStyles[0]);
			GUI.backgroundColor = new Color(0,0,0,0.5);
			GUILayout.Label("Waiting for Match to Start..." , m_GUISkin.label);
			for(var i:int= 0; i < cliScript.GetNumClients(); i++)
			{
				GUILayout.Label(cliScript.GetClient(i).m_Name, m_GUISkin.label);		
			}
			GUI.backgroundColor = Color.white;
			GUILayout.EndArea();
		}
		else
		{
			var data : HostData[] = MasterServer.PollHostList();	
			if(GUILayout.Button("Refresh ServerList", m_GUISkin.button))
			{
				GetHosts();
			}
			
			if(data.length == 0)
			{
				m_HostListWaitTimer -= Time.deltaTime;
				if(m_HostListWaitTimer > 0)
					GUILayout.Label("Searching for games...");
				else
					GUILayout.Label("0 games found...");
			}
			
			// Go through all the hosts in the host list
			for (var element in data)
			{
				//GUILayout.BeginHorizontal();	
				var name = element.gameName + " " + element.connectedPlayers + " / " + element.playerLimit;
				
				var hostInfo : String;
				hostInfo = "[";
				for (var host in element.ip)
					hostInfo = hostInfo + host + ":" + element.port + " ";
				hostInfo = hostInfo + "]";
				
				if (GUILayout.Button(name+" "+hostInfo+" "+element.comment, m_GUISkin.button))
				{
					// Connect to HostData struct, internally the correct method is used (GUID when using NAT).
					Network.Connect(element);
					//this.enabled = false;			
				
				}
				//GUILayout.EndHorizontal();	
			}
			
			GUILayout.FlexibleSpace();
			GUILayout.BeginHorizontal();
		//	GUILayout.FlexibleSpace();		
			if(GUILayout.Button("Return to Main Menu", m_GUISkin.button))
			{	
				gameObject.Destroy(gameObject.Find("GameClient"));
				Application.LoadLevel(0);
			}
			GUILayout.EndHorizontal();
		}
	
		GUILayout.EndArea();
	}
}

@RPC function SetLevelPreviewIndex(index:int)
{
	m_LevelIndex = index;
}

function OnFailedToConnect(error: NetworkConnectionError) {
    Debug.Log("Could not connect to server: "+ error);
}

function OnConnectedToServer() {
	//Network.isMessageQueueRunning = false;
	//Application.LoadLevel("Scene2");
    Debug.Log("Connected to server");
    // Send local player name to server ...
}



