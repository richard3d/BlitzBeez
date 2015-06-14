//this script is intended to behave like a decorator

#pragma strict


public var  m_Lifetime : float = 0.15;
public var m_LastCoin:GameObject= null;
private var m_CoinCount:int = 0;
function Awake()
{

}

function FindCoin(lastCoin:GameObject)
{
	//we just got a coin so show the xp text
	m_CoinCount++;
	m_Lifetime = 0.2;
	if(NetworkUtils.IsLocalGameObject(gameObject))
	 {
		var kudosText:GameObject = null;
		if(gameObject.Find("XPKudos") != null)
		{
			kudosText = gameObject.Find("XPKudos");
		}
		else
		{
			kudosText = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
		}
		 kudosText.name = "XPKudos";
		 kudosText.animation.Stop();
		 kudosText.animation["KudosText"].time = 0;
		 kudosText.animation.Play("KudosText");
		 kudosText.GetComponent(GUIText).material.color = Color.yellow;
		 kudosText.GetComponent(KudosTextScript).m_WorldPos = transform.position;
		 kudosText.GetComponent(UpdateScript).m_Lifetime = 2;
		 kudosText.GetComponent(GUIText).text = "+"+m_CoinCount+" XP";
		 kudosText.GetComponent(GUIText).fontSize = 32;
		 kudosText.GetComponent(KudosTextScript).m_CameraOwner = gameObject.GetComponent(BeeScript).m_Camera;
		 kudosText.layer = LayerMask.NameToLayer("GUILayer_P"+(gameObject.GetComponent(NetworkInputScript).m_ClientOwner+1));
	 }
	 
	
	if(!Network.isServer)
		return;
	
	//and look for new coin to dash to if one exists
	var closestCoin : GameObject = null;
	var dist = 99999;
	var coins :GameObject [] = GameObject.FindGameObjectsWithTag("Coins");
	for(var coin:GameObject in coins)
	{
		if((gameObject.transform.position - coin.transform.position).magnitude < dist && 
			coin != lastCoin && 
			!coin.animation.IsPlaying("GetCoin") && 
			coin.GetComponent(TerrainCollisionScript).m_OverTerrain)
		{
			dist = (gameObject.transform.position - coin.transform.position).magnitude;
			closestCoin = coin;
		}
	}
	
	if(closestCoin != null)
	{
		//gameObject.GetComponent(BeeDashDecorator).Disable(); 
		DestroyImmediate(gameObject.GetComponent(BeeDashDecorator));
		var vel = (closestCoin.transform.position - gameObject.transform.position);
		vel.y = 0;
		gameObject.GetComponent(UpdateScript).m_Vel = vel.normalized * gameObject.GetComponent(UpdateScript).m_DefaultMaxSpeed;
		if(GetComponent(BeeDashDecorator) == null)
			gameObject.AddComponent(BeeDashDecorator);
	}
}

function Start () {

	
	FindCoin(null);

}

function Update () {
	
	if(m_Lifetime > 0)
	{
		m_Lifetime -= Time.deltaTime;
	//	m_LightEffect.transform.localScale = Vector3(12*m_Lifetime,300,12*m_Lifetime);
		if(m_Lifetime <= 0)
		{
			if(Network.isServer)
				ServerRPC.Buffer(networkView, "RemoveComponent",RPCMode.All, "CoinDashDecorator");
		}
	}
	
}



function OnDestroy()
{

	
}

