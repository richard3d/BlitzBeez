#pragma strict
var m_Blink:boolean = true;
private var m_BlinkFreq:float = 0.10f;
private var m_BlinkTimer:float = 0.10f;
private var m_Lifetime:float =0.5;
function Start () {
m_Lifetime = 0.5;
}

function Update () {


	if(m_BlinkTimer > 0 && m_Blink)
	{
		m_BlinkTimer -= Time.deltaTime;
		if(m_BlinkTimer <= 0)
		{
			renderer.enabled = !renderer.enabled;
			m_BlinkTimer = m_BlinkFreq;
		}
	}
	
	m_Lifetime -= Time.deltaTime;
	if(m_Lifetime < 0)
	{
			renderer.enabled  = true;
		
			Destroy(this);
	}

}

function OnDestroy()
{
	Debug.Log("Showing");
	renderer.enabled  = true;
}