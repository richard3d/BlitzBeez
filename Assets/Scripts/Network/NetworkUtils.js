#pragma strict
import ClientNetworkInfo;
public class NetworkUtils
{
	//What we really want to ask is, does this object exist under my control?
	// public static function IsControlledGameObject(go:GameObject ):boolean 
	// {
		
		// if((Network.isServer && GameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == go) ||
			// (Network.isClient && GameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == go))
		// {
			// return true;
		// }
		// return false;
	// }
	public static function IsLocalGameObject(go:GameObject):boolean
	{
		if(go.GetComponent(NetworkInputScript).m_LocalClient)
		{
			return true;
		}
		return false;
	}
	public static function IsControlledGameObject(go:GameObject):boolean 
	{
		
		if((Network.isServer && GameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == go) ||
			(Network.isClient && GameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == go))
		{
			return true;
		}
		return false;
	}
	
	public static function GetControlledGameObject():GameObject
	{
		if(Network.isServer)
			return GameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject();
		return GameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject();
	}
	
	public static function GetNumClients():int
	{
		if(Network.isServer)
			return GameObject.Find("GameServer").GetComponent(ServerScript).GetNumClients();
		return GameObject.Find("GameClient").GetComponent(ClientScript).GetNumClients();
			
	}
	
	public static function GetColor(go:GameObject):Color
	{
		var clientID:int = GetClientFromGameObject(go);
		if(Network.isServer)
		{
			return GameObject.Find("GameServer").GetComponent(ServerScript).GetClient(clientID).m_Color;
		}
		else if(Network.isClient )
		{
			return GameObject.Find("GameClient").GetComponent(ClientScript).GetClient(clientID).m_Color;
		}
		
		return Color.white;
	}
	
	public static function GetGameObjectFromClient(index:int) : GameObject 
	{
		if(Network.isServer )
			return	GameObject.Find("GameServer").GetComponent(ServerScript).GetClient(index).m_GameObject;
			
		return GameObject.Find("GameClient").GetComponent(ClientScript).GetClient(index).m_GameObject;
	}
	
	public static function GetClientFromGameObject(go:GameObject):int
	{
		for(var i:int = 0; i < GetNumClients(); i++)
		{
			if(go == GetGameObjectFromClient(i))
				return i;
		}
		return -1;
	}
	
	public static function GetClientObjectFromGameObject(go:GameObject):ClientNetworkInfo
	{
		var clientID:int = GetClientFromGameObject(go);
		if(clientID < 0)
			return null;
		if(Network.isServer)
		{
			return GameObject.Find("GameServer").GetComponent(ServerScript).GetClient(clientID);
		}
		else if(Network.isClient )
		{
			return GameObject.Find("GameClient").GetComponent(ClientScript).GetClient(clientID);
		}
		return null;
	}
}