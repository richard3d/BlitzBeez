#pragma strict
private var m_BlinkFreq:float = 0.10f;
private var m_BlinkTimer:float = 0.10f;
private var m_Lifetime:float =2;
function Start () {
m_Lifetime = 1.5;
}

function Update () {


	if(m_BlinkTimer > 0)
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