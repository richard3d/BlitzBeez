#pragma strict
private var m_ScoreTimer :float = 5;
function Start () {

}

//checks for a level up and returns the level
function CheckForLevelup (flower:GameObject) : int {
	

	var owner:GameObject = flower.GetComponent(FlowerScript).m_Owner;
	if(flower.GetComponent(FlowerScript).m_NumBees == 1)
	{
		for(var child:Transform in transform)
		{
			if(child.GetComponent(FlowerScript).m_NumBees < 1 || child.GetComponent(FlowerScript).m_Owner != owner)
				return 0;
		}
		return 1;
	}
	
	if(flower.GetComponent(FlowerScript).m_NumBees == 2)
	{
		for(var child:Transform  in transform)
		{
			if(child.GetComponent(FlowerScript).m_NumBees < 2 || child.GetComponent(FlowerScript).m_Owner != owner)
				return 0;
		}
		return 2;
	}
	
	if(flower.GetComponent(FlowerScript).m_NumBees == 3)
	{
		for(var child:Transform  in transform)
		{
			if(child.GetComponent(FlowerScript).m_NumBees < 3 || child.GetComponent(FlowerScript).m_Owner != owner)
				return 0;
		}
		return 3;
	}
	return 0;
}


function GetCurrentLevel() : int
{
	var level:int = 9999;
	for(var child:Transform in transform)
	{
		if(child.GetComponent(FlowerScript).m_NumBees < level)
			level = child.GetComponent(FlowerScript).m_NumBees;
	}
	return level;
}

function Flash()
{
	for(var child:Transform in transform)
	{
		if(child.gameObject.GetComponent(FlasherDecorator) == null)
		{
			child.gameObject.AddComponent(FlasherDecorator);
			child.gameObject.GetComponent(FlasherDecorator).m_NumberOfFlashes = 15;
		}
		child.gameObject.animation.Play();
		var impactEffect:GameObject =  GameObject.Instantiate(Resources.Load("GameObjects/ImpactEffect"));
		
		impactEffect.transform.position = child.transform.position;
		impactEffect.transform.localScale.x = impactEffect.transform.localScale.z = child.transform.localScale.x;
		impactEffect.transform.localScale.y = 50;
	}
}

function CalcScoreForBee(bee:GameObject)
{
	var score:int = 0;
	for(var child:Transform in transform)
	{
		if(child.GetComponent(FlowerScript).m_Owner != null)
		{	
			if(bee == child.GetComponent(FlowerScript).m_Owner)
			{
				score++;
			}
			
		}
	}
	//flowers are owned by the bee
	if(score == transform.childCount)
	{
		score = ( (GetCurrentLevel()+1) * score);
	}
	return score;
}

function CalcScore()
{
	var singleOwner = true;
	var currOwner:GameObject = null;
	for(var child:Transform in transform)
	{
		if(child.GetComponent(FlowerScript).m_Owner != null && child.GetComponent(FlowerScript).m_Owner != currOwner)
		{	
			if(currOwner != null)
				singleOwner = false;
			currOwner = child.GetComponent(FlowerScript).m_Owner; 
		}
		else
		if(child.GetComponent(FlowerScript).m_Owner == null)
		{
			singleOwner = false;
		}
	}
	
	//find out who the single owner is

	if(singleOwner)
	{
		//look at the production level
		//each flower gets a multiplier on the score for this group
		var honey:int = 0;
		for(var child:Transform in transform)
		{
			honey += ( GetCurrentLevel()+1 /** child.GetComponent(FlowerScript).m_NumBees*/);
		}
		
		ServerRPC.Buffer(currOwner.networkView, "SetHoneyPoints", RPCMode.All, currOwner.GetComponent(BeeScript).m_Honey+honey);
	}
	else
	{
		for(var child:Transform in transform)
		{
			var owner:GameObject = child.GetComponent(FlowerScript).m_Owner; 
			if(owner != null)
				ServerRPC.Buffer(owner.networkView, "SetHoneyPoints", RPCMode.All, owner.GetComponent(BeeScript).m_Honey+1);	
		}
	}
}

function Update () {

	if(m_ScoreTimer > 0)
	{
		m_ScoreTimer -= Time.deltaTime;
		if(m_ScoreTimer <= 0)
		{
			
			if(Network.isServer && GameStateManager.m_CurrState == GameStateManager.MATCH_PLAYING)
			{
			//	CalcScore();
				//Debug.Log("Checking for win");
				GameStateManager.CheckForWin();
			}
			m_ScoreTimer = 5;
		}
	}

}