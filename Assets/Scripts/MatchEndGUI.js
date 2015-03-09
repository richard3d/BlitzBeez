#pragma strict

private var m_Life:float = -1;
private var m_Lifetime:float = 0.25;

function Start () {
	m_Life = m_Lifetime;
	GetComponent(GUIScript).m_ImgColor = Color.black;
	
	
}

function Update () {

	if(m_Life > 0)
	{
		m_Life -= Time.deltaTime;
		if(m_Life  <= 0)
		{
			Camera.main.depth = 99;
			GetComponent(GUIScript).enabled = false;
			var cams:GameObject[] = GameObject.FindGameObjectsWithTag("PlayerCamera");
			for(var cam :GameObject in cams)
			{
				cam.active = false;
			}
		}
		
	}
	
	
}

function OnGUI()
{
	GetComponent(GUIScript).m_Rect.width =  1-(m_Life/m_Lifetime);
}