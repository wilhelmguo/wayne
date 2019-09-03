package models

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const (
	TableNameService = "service"
)

type serviceModel struct{}

type Service struct {
	Id          int64  `orm:"auto" json:"id,omitempty"`
	Name        string `orm:"unique;index;size(128)" json:"name,omitempty"`
	MetaData    string `orm:"type(text)" json:"metaData,omitempty"`
	App         *App   `orm:"index;rel(fk)" json:"app,omitempty"`
	Description string `orm:"null;size(512)" json:"description,omitempty"`
	OrderId     int64  `orm:"index;default(0)" json:"order"`

	CreateTime *time.Time `orm:"auto_now_add;type(datetime)" json:"createTime,omitempty"`
	UpdateTime *time.Time `orm:"auto_now;type(datetime)" json:"updateTime,omitempty"`
	User       string     `orm:"size(128)" json:"user,omitempty"`
	Deleted    bool       `orm:"default(false)" json:"deleted,omitempty"`

	AppId int64 `orm:"-" json:"appId,omitempty"`
}

func (*Service) TableName() string {
	return TableNameService
}

func (*serviceModel) GetNames(filters map[string]interface{}) ([]Service, error) {
	services := []Service{}
	qs := Ormer().
		QueryTable(new(Service))

	if len(filters) > 0 {
		for k, v := range filters {
			qs = qs.Filter(k, v)
		}
	}

	_, err := qs.All(&services, "Id", "Name")

	if err != nil {
		return nil, err
	}

	return services, nil
}

func (*serviceModel) Add(m *Service) (id int64, err error) {
	m.App = &App{Id: m.AppId}
	m.CreateTime = nil
	id, err = Ormer().Insert(m)
	return
}

func (*serviceModel) UpdateOrders(services []*Service) error {
	if len(services) < 1 {
		return errors.New("services' length should greater than 0. ")
	}
	batchUpateSql := fmt.Sprintf("UPDATE `%s` SET `order_id` = CASE ", TableNameService)
	ids := make([]string, 0)
	for _, service := range services {
		ids = append(ids, strconv.Itoa(int(service.Id)))
		batchUpateSql = fmt.Sprintf("%s WHEN `id` = %d THEN %d ", batchUpateSql, service.Id, service.OrderId)
	}
	batchUpateSql = fmt.Sprintf("%s END WHERE `id` IN (%s)", batchUpateSql, strings.Join(ids, ","))

	_, err := Ormer().Raw(batchUpateSql).Exec()
	return err
}

func (*serviceModel) UpdateById(m *Service) (err error) {
	v := Service{Id: m.Id}
	// ascertain id exists in the database
	if err = Ormer().Read(&v); err == nil {
		m.UpdateTime = nil
		m.App = &App{Id: m.AppId}
		_, err = Ormer().Update(m)
		return err
	}
	return
}

func (*serviceModel) GetById(id int64) (v *Service, err error) {
	v = &Service{Id: id}

	if err = Ormer().Read(v); err == nil {
		v.AppId = v.App.Id
		return v, nil
	}
	return nil, err
}

func (*serviceModel) DeleteById(id int64, logical bool) (err error) {
	v := Service{Id: id}
	// ascertain id exists in the database
	if err = Ormer().Read(&v); err == nil {
		if logical {
			v.Deleted = true
			_, err = Ormer().Update(&v)
			return err
		}
		_, err = Ormer().Delete(&v)
		return err
	}
	return
}
