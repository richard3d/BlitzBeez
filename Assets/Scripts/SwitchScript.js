#pragma strict

//a player interacts with a switch and it turns on,
//after a duration it turns itself off

var m_SwitchListeners : GameObject[];
var m_Active:boolean = false;
var m_Duration:float = 10;
private var m_DurationTimer:float = 0;

function Start () {


}

function Update () {

	if(Network.isServer)
	{
		if(m_DurationTimer > 0)
		{
			m_DurationTimer -= Time.deltaTime;
			if(m_DurationTimer <= 0)
			{
				m_Active = false;
				GetComponent.<NetworkView>().RPC("OnSwitch", RPCMode.All, false);
			}
		}	
	}
}

function OnTriggerEnter(other:Collider)
{
	if(Network.isServer)
	{
		if(other.gameObject.tag == "Player")
		{
			//this check prevents multiple messgs from firing due to multiple collisions
			if(!m_Active)
			{
				m_Active = true;
				GetComponent.<NetworkView>().RPC("OnSwitch", RPCMode.All, true);
			}
		}
	}
}

@RPC function OnSwitch(active:boolean)
{
	//redundant for server but needed for client
	m_Active = active;
	if(m_Active)
	{
		m_DurationTimer = m_Duration;
		GetComponent.<Renderer>().material.mainTextureOffset = Vector2(0.5,0);
	}
	else
	{
		GetComponent.<Renderer>().material.mainTextureOffset = Vector2(0,0);
	}
	for (var go:GameObject in m_SwitchListeners)
	{
		if(m_Active)
			go.SendMessage("OnSwitchActivated",SendMessageOptions.DontRequireReceiver);
		else
			go.SendMessage("OnSwitchDeactivated",SendMessageOptions.DontRequireReceiver);
	}
}