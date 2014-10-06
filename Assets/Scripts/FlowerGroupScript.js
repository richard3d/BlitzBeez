#pragma strict
private var m_ScoreTimer :float = 5;
function Start () {

}

//checks for a level up and returns the level
function CheckForLevelup (flower:GameObject) : int {
	

	if(flower.GetComponent(FlowerScript).m_NumBees == 1)
	{
		for(var child:Transform in transform)
		{
			if(child.GetComponent(FlowerScript).m_NumBees < 1)
				return 0;
		}
		return 1;
	}
	
	if(flower.GetComponent(FlowerScript).m_NumBees == 2)
	{
		for(var child:Transform  in transform)
		{
			if(child.GetComponent(FlowerScript).m_NumBees < 2)
				return 0;
		}
		return 2;
	}
	
	if(flower.GetComponent(FlowerScript).m_NumBees == 3)
	{
		for(var child:Transform  in transform)
		{
			if(child.GetComponent(FlowerScript).m_NumBees < 3)
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
	}
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
		for(var child:Transform in transform)
		{
			child.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Honey += ( GetCurrentLevel()+1 * child.GetComponent(FlowerScript).m_NumBees);
		}
	}
	else
	{
		for(var child:Transform in transform)
		{
			if(child.GetComponent(FlowerScript).m_Owner != null)
				child.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Honey += 1;
		}
	}
}

function Update () {

	if(m_ScoreTimer > 0)
	{
		m_ScoreTimer -= Time.deltaTime;
		if(m_ScoreTimer <= 0)
		{CalcScore();
			m_ScoreTimer = 5;
		}
	}

}